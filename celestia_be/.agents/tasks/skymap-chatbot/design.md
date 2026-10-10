# Design: Sky Map Astronomy Chatbot ("where is constellation X?")

## Overview

This feature adds a text chatbot to the 3D Sky Map page (`celestia_fe/src/features/skymap/`) that
answers natural-language astronomy questions, with a specialization: when the user asks where a
constellation is, the backend computes its real-time visibility (altitude, azimuth/compass direction,
and — if below the horizon — the next rise time) for the exact location and time the map is currently
rendering, and the LLM only phrases those facts into a friendly sentence. All directional/visibility
numbers are computed deterministically on the backend; the LLM is forbidden from inventing them.

The work spans three subsystems:

1. **Backend astronomy math** — a new `AstronomyService` that ports the frontend's exact Julian-date and
   Local-Sidereal-Time formulas and adds the inverse (RA/Dec → alt/az) transform plus a rise-time solver
   and a four-state visibility classifier.
2. **Backend chat orchestration** — a new `SkyChatService` that fuzzy-resolves the constellation name,
   calls `AstronomyService` to compute structured visibility facts, and calls the existing `GroqService`
   to phrase the answer. A new controller endpoint `POST /skymap/chat` exposes it, with DTOs added to the
   existing OpenAPI spec (DTOs are generated — see below).
3. **Frontend chat UI** — a chat widget on the sky-map page, modeled on the existing constellation-page
   chat, that threads the current lat/lon (real GPS if granted, else Bucharest 44.4/26.1) and the current
   time into every request.

The technology stack is **locked** by the existing project and is reused unchanged: Java 21, Spring Boot
3.3.2, Spring Web, MongoDB (Spring Data), MapStruct 1.5.5, OpenAPI Generator Maven plugin 7.5.0 (spring
generator, `interfaceOnly=true`), GroqCloud via `GroqService` (model `openai/gpt-oss-120b` by default),
JUnit 5 / `spring-boot-starter-test` for tests; React + Vite + three.js on the frontend. No new
dependencies are introduced.

---

## 1. Per-constellation RA/Dec source

**Decision: bake a static table of the 88 IAU constellation centers into the backend, keyed by
abbreviation, and seed it onto the `Constellation` documents.** The centers are precomputed from the
frontend star catalog using the *exact same magnitude-weighted centroid algorithm the frontend already
uses to place constellation labels* (`buildConstellations` in `useSceneBuilder.js`), so the chatbot's
"center" of a constellation coincides with where the rendered label sits.

**Critical detail (verified against `useSceneBuilder.js`): the frontend centroids ONLY the stars that are
endpoints of the constellation's drawn `lines`, not every catalog star tagged with that constellation.**
`buildConstellations` computes `members = [...new Set(con.lines.flat())].map(h => byHip[h])` and weights
*those* members. To truly match the rendered label position, the center table MUST be built over the same
line-member HIP set — NOT over all `con == abr` stars (which would be a different, label-mismatched
center, differing by up to ~3° in Dec for sparse constellations like Apus). The Appendix script below
centroids the line-member HIPs, so the table and the rendered label coincide by construction.

### Why this over the alternatives

- **Computing from the star catalog at runtime on the backend** was rejected because the backend has no
  star catalog — `stars_full.json` (3.7 MB, HIP-indexed RA/Dec) lives only in the frontend
  (`celestia_fe/public/data/data/`). Shipping and parsing it in the backend for one scalar pair per
  constellation is wasteful, and the RA wraparound centroid math would have to be re-derived and kept in
  sync with the frontend anyway.
- **A DB field populated from an external catalog** was rejected: `Constellation` (MongoDB document) has
  no RA/Dec field today and the seed JSON (`celestia_be/src/main/resources/constellations.json`) has
  **no** RA/Dec (verified: 0 occurrences of ra/dec/rightAscension/declination). Introducing an external
  dependency for 88 fixed numbers is unjustified.
- **The chosen static table** is the simplest robust path. The numbers are fixed astronomical facts; a
  checked-in table of 88 entries is deterministic, offline, test-friendly, and guaranteed consistent with
  the rendered map because it is derived from the same catalog and the same algorithm.

### Centroid algorithm (exact, matching the frontend)

For each constellation abbreviation `abr`, over **exactly the line-member stars** — the set of HIP ids that
appear as endpoints in that constellation's `lines`, i.e. `membersHips = unique(flatten(con.lines))`,
mapped through the HIP index and keeping only those present — with weight `w = max(0.1, 6 - mag)`:

```
membersHips = unique( flatten(con.lines) )           # SAME set buildConstellations uses
members     = [ byHip[h] for h in membersHips if present ]
avgRa  = atan2( Σ sin(ra°)·w , Σ cos(ra°)·w )  normalized to [0,360)
avgDec = ( Σ dec·w ) / ( Σ w )
```

This is byte-for-byte the frontend's `buildConstellations` centroid (same member set, same `6 - mag`
weight, same `atan2` RA vector sum, same `[0,360)` normalization), so the backend center and the rendered
label land on the same point. RA is handled with the sin/cos vector sum so the 0°/360° wraparound is
correct. **RA and Dec are both in
degrees** throughout this project (verified: catalog `ra` ranges 0–359.98, not 0–24; and `useSkyMap.js`
feeds `getLST(...)` — which returns degrees — directly as the RA argument of `eqVec`, confirming the RA
axis is degrees everywhere).

### Where the table lives and how it is applied

- Add `celestia_be/src/main/resources/constellation-centers.json`: a JSON object keyed by the 88 IAU
  abbreviations, each `{ "ra": <deg>, "dec": <deg> }`. These are generated once from the frontend catalog
  by the centroid formula above and checked in. Sample verified values (rounded to 2 dp):

  These are the **line-member centroids** (the values the Appendix script actually produces, verified
  against `stars_full.json`/`constellations.json`), rounded to 2 dp:

  | Abbr | RA° | Dec° |     | Abbr | RA° | Dec° |
  |------|-----|------|-----|------|-----|------|
  | And  | 9.27 | 37.74 |   | Ori  | 81.92 | 4.36 |
  | Ant  | 152.61 | -33.08 | | Cru  | 188.65 | -59.31 |
  | Aps  | 240.69 | -78.57 | | Car  | 133.28 | -60.70 |
  | Aql  | 294.23 | 4.71 |   | UMi  | 245.05 | 79.78 |
  | Aqr  | 337.95 | -7.94 | | Oph  | 254.02 | -0.92 |
  | Ara  | 260.43 | -54.98 | | Sco  | 254.19 | -33.84 |

  (The implementer regenerates the full 88-row file with the script in the Appendix; these rows are the
  numeric anchors the unit tests will assert against. They are the line-member centroids, so they match the
  rendered label positions — not the all-`con`-star centroids, which would differ by up to ~3° in Dec.)

- Add two fields to `Constellation` (model/`Constellation.java`): `private Double centerRa;` and
  `private Double centerDec;` (nullable `Double`, Lombok `@Getter/@Setter` like the rest).
- Extend `ConstellationSeeder.run(...)`. The current method (verified) returns early when `count() > 0` and
  only ever calls `saveAll` on a fresh load — it never updates existing documents, so a back-fill placed
  *after* the early `return` would be dead code on exactly the already-seeded databases it is meant to fix.
  Restructure so the back-fill runs **unconditionally, independent of the `count() > 0` guard**:

  1. Load `constellation-centers.json` into a `Map<String, double[]>` keyed by abbreviation (the centers
     map) first, before any guard.
  2. **If** `count() == 0`: do the existing fresh seed (parse `constellations.json`, set
     `centerRa/centerDec` on each from the centers map by abbreviation, `saveAll`). Then `return`.
  3. **Else** (`count() > 0`, already seeded): stream the existing constellations, and for every one whose
     `centerRa` is null, set `centerRa/centerDec` from the centers map and persist it. Persist only the
     mutated subset — collect the changed documents and `saveAll(changed)` once (or `save` each). This
     upgrades older databases that were seeded before the fields existed, and is idempotent: on a
     subsequent startup every `centerRa` is already non-null, so nothing is written.

  Concretely the method shape becomes "load centers map → if empty seed-with-centers and return → else
  back-fill nulls and save," so the back-fill is never short-circuited by the early return.
  - Invariant ownership: `ConstellationSeeder` is the **single writer** of `centerRa/centerDec` (both the
    fresh-seed path and the back-fill path); nothing else mutates them. `SkyChatService` treats them as
    read-only facts.

---

## 2. HTTP endpoint and DTOs (generated, matching the existing mechanism)

**DTOs are OpenAPI-generated**, not hand-written. The project generates request/response models from
`celestia_be/src/main/resources/openapi.yaml` into `org.celestia.generated.model` via the
openapi-generator-maven-plugin (`generatorName: spring`, `interfaceOnly: true`). The existing
`ChatRequest`/`ChatResponse`/`ChatMessage` are generated this way and used directly by
`ConstellationController`. The new endpoint follows the same mechanism: **add schemas and a path to
`openapi.yaml`; do not hand-roll DTO classes.**

### New path in `openapi.yaml`

```yaml
  /skymap/chat:
    post:
      operationId: chatWithSky
      tags:
        - SkyMap
      summary: Ask the sky-map astronomy chatbot; backend computes constellation visibility
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SkyChatRequest'
      responses:
        "200":
          description: Assistant reply plus structured visibility facts
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SkyChatResponse'
```

### New schemas in `openapi.yaml`

```yaml
    SkyChatRequest:
      type: object
      required:
        - messages
        - latitude
        - longitude
      properties:
        messages:
          type: array
          items:
            $ref: '#/components/schemas/ChatMessage'   # reuse existing role/content shape
        latitude:
          type: number
          format: double
          example: 44.4
        longitude:
          type: number
          format: double
          example: 26.1
        time:
          type: string
          format: date-time
          description: ISO-8601 instant the map is rendering. If omitted, server uses now (UTC).
          example: "2026-01-15T21:30:00Z"

    SkyChatResponse:
      type: object
      properties:
        reply:
          type: string
        visibility:
          $ref: '#/components/schemas/VisibilityFacts'   # nullable: only present for a resolved constellation

    VisibilityFacts:
      type: object
      properties:
        constellation:
          type: string
          example: Orion
        abbreviation:
          type: string
          example: Ori
        state:
          type: string
          description: One of VISIBLE, AT_HORIZON, BELOW_RISES, NEVER_VISIBLE
          example: VISIBLE
        altitudeDeg:
          type: number
          format: double
          example: 34.2
        azimuthDeg:
          type: number
          format: double
          example: 128.5
        compass:
          type: string
          example: SE
        nextRiseUtc:
          type: string
          format: date-time
          description: >
            Present only for state BELOW_RISES. An authoritative UTC instant (always a real
            `...Z` instant) at which the constellation next crosses the horizon upward. The
            frontend formats it in the browser's own IANA zone via `toLocaleString()`; the
            backend never guesses a civil offset.
        nextRiseInHours:
          type: number
          format: double
          description: >
            Present only for state BELOW_RISES. Zone-independent delta in hours from the request
            time to `nextRiseUtc` (e.g. 3.5), for phrasing "in about N hours".
        riseCompass:
          type: string
          description: Present only for state BELOW_RISES
```

`messages` reuses the existing `ChatMessage` schema (array of `{role, content}`), so the frontend sends
the same running transcript it already builds for the constellation chat. `time` is optional; when the
frontend sends the map's current time it is honored, otherwise the server falls back to `Instant.now()`.

**Request contract / validation** (see §6 for behavior-on-failure detail):

| Field | Required | Type | Limits | On failure |
|-------|----------|------|--------|------------|
| `messages` | yes | array of `{role,content}` | non-empty; last message role should be `user` | empty/null → 400 |
| `latitude` | yes | double | [-90, 90] | out of range/null → 400 |
| `longitude` | yes | double | [-180, 180] | out of range/null → 400 |
| `time` | no | ISO-8601 `date-time` (→ `OffsetDateTime`) | parseable by Jackson | unparseable → 400 (via `HttpMessageNotReadableException` handler, see §6 — this fires during body deserialization, *before* the service); absent → use `Instant.now()` |

---

## 3. Astronomy algorithms (exact) and numeric verification

All math goes in a new `AstronomyService` (`service/AstronomyService.java`), a stateless `@Service` with
pure static-style methods (instance methods for Spring injectability + unit testing). Angles in degrees at
the API boundary; radians internally.

### 3.1 Julian date — ported verbatim from `astronomy.js` `toJD`

```
y = UTC year, m = UTC month (1-12)
d = UTC day + hour/24 + minute/1440 + second/86400
A = floor(y/100); B = 2 - A + floor(A/4)
JD = floor(365.25*(y+4716)) + floor(30.6001*(m+1)) + d + B - 1524.5
```

Java source of time: a `java.time.Instant` → `OffsetDateTime` at `ZoneOffset.UTC`; pull UTC Y/M/D/h/m/s
and fractional seconds. Use `Math.floor` to match the JS integer-flooring exactly.

### 3.2 Local Sidereal Time — ported verbatim from `getLST` (returns **degrees**)

```
T    = (JD - 2451545.0) / 36525.0
GMST = (280.46061837 + 360.98564736629*(JD - 2451545.0) + 0.000387933*T*T) mod 360
LST  = ((GMST + lon) mod 360 + 360) mod 360
```

Mirror JS `%` semantics: Java `%` on doubles already behaves like JS for these values; the final
double-mod-then-+360-then-mod guarantees `[0,360)`.

### 3.3 Inverse transform RA/Dec → alt/az (the key new math)

The frontend `altAzLookTarget` goes alt/az → RA/Dec. The chatbot needs the inverse. Standard formulas,
with azimuth measured from **North through East** (the convention the frontend's horizon labels use — see
verification):

```
H       = LST - RA                                   (hour angle, degrees)
sin(alt)= sin(lat)·sin(dec) + cos(lat)·cos(dec)·cos(H)
alt     = asin(clamp(sin(alt), -1, 1))
az      = atan2( -sin(H)·cos(dec),
                  cos(lat)·sin(dec) - sin(lat)·cos(dec)·cos(H) )
az      = (deg(az) + 360) mod 360                    -> [0,360) from North through East
```

### 3.4 Numeric verification of the inverse against the frontend convention

Verified with `lat = 44.4°`, `LST = 100°` (and the never-rises checks at `lat = 44.4°`). These exact
checks become unit-test assertions (§7):

| Input (RA°, Dec°) | Expected (frontend convention) | Computed | Pass |
|-------------------|-------------------------------|----------|------|
| RA = LST, Dec = lat (object at zenith) | alt ≈ 90 | alt = 90.0, az = 0.0 | ✓ |
| Dec = +90 (celestial pole) | alt ≈ lat, az ≈ 0 (North) | alt = 44.4, az = 0.0 | ✓ |
| RA = LST, Dec = 10 (on meridian, south of zenith since dec<lat) | az ≈ 180 (South) | alt = 55.6, az = 180.0 | ✓ |
| RA = LST, Dec = 70 (on meridian, north of zenith since dec>lat) | az ≈ 0 (North) | alt = 64.4, az = 0.0 | ✓ |

The horizon-label check: the frontend places the `S` label at `az = 180` and `N` at `az = 0`
(`buildHorizonLabels` in `useSceneBuilder.js`). A southern object culminating on the meridian maps to
`az = 180` under our inverse, which agrees with where the frontend draws "S" — so chatbot directions and
the rendered compass agree. Pole → az 0/North and zenith → alt 90 confirm the orientation and tilt match.

### 3.5 Rise-time solver

**Decision: use the closed-form hour-angle-at-horizon formula to decide rise/never, then a short
refinement sample for the local rise clock time.** Rationale: the closed form `cos(H0) = -tan(lat)·tan(dec)`
gives an exact, cheap `never-rises` / `circumpolar` / `rises` classification (no 24 h scan needed, no risk
of a coarse sampler stepping over a brief above-horizon window), which is exactly what distinguishes
states 3 and 4. We then compute the next upward 0-crossing time analytically and keep it robust with a
tiny local refinement.

Algorithm:

```
x = -tan(lat)·tan(dec)
if x > 1      -> object never rises  (always below horizon)   => state 4 candidate
if x < -1     -> object is circumpolar (never sets, always up) => treat as "rises/visible"
else:
    H0 = acos(x)                         (degrees, the hour angle of rising/setting)
    # Rising occurs at hour angle H = -H0 (i.e. 360-H0). RA transit at H = 0.
    # LST at rise = RA - H0 (mod 360). Convert the LST gap to a UT time delta.
    deltaLstDeg = ((RA - H0) - LST_now mod 360 + 360) mod 360   # degrees of sidereal rotation until next rise
    deltaHours  = deltaLstDeg / 15.0 * (1 / 1.0027379)          # sidereal->solar time ratio
    nextRiseUtc = now + deltaHours
```

Then **refine**: evaluate `alt` at `nextRiseUtc` and step ±a few minutes using §3.3 to land on the exact
upward 0-crossing (handles the sidereal-rate approximation and the dec being treated as fixed over a day —
fine for constellations, which don't move).

**Representation of the rise time (no longitude guessing).** The authoritative value emitted is
`nextRiseUtc`, a true UTC `java.time.Instant` serialized as a real `...Z` instant — the backend does
**not** fabricate a civil wall-clock time, because the request carries only lon/lat and no IANA timezone,
so a `lon/15` offset would be wrong by up to ~1 h plus any DST gap. The service also emits
`nextRiseInHours = Duration.between(requestTime, nextRiseUtc).toMinutes() / 60.0`, a zone-independent
delta, which is **strictly positive by construction** (`deltaLstDeg` is normalized into `[0,360)` and the
refinement only nudges by minutes, so `nextRiseUtc` is always after `requestTime`; a would-be zero crossing
of exactly "now" is instead classified AT_HORIZON, not BELOW_RISES).

**Degraded fallback (refinement finds no crossing in the window).** If the ±minutes refinement fails to
land a clean upward 0-crossing (should not happen once the closed-form `x` test has passed, but guarded
anyway), the service emits `nextRiseInHours` from the **pre-refinement analytic `deltaHours`** (rounded,
and clamped to be strictly `> 0`) and **omits `nextRiseUtc`**. So `nextRiseInHours` is always present for
BELOW_RISES — in the normal path derived from `nextRiseUtc`, in the degraded path derived from the analytic
`deltaHours` — and the FACTS block (§5) then carries only `next_rise_in_hours`, which the LLM phrases as
"within about N hours." `riseCompass` is still computed from the analytic `nextRiseUtc` estimate before it
is dropped. The **frontend** renders `nextRiseUtc` in the browser's own IANA zone via
`new Date(nextRiseUtc).toLocaleString()` (the browser knows the user's real zone), and the FACTS block
passed to the LLM carries the rise as the UTC instant **plus** the "in about N hours" delta — so no
phrasing ever depends on a guessed offset. The rise **direction** is the azimuth computed at
`nextRiseUtc` mapped through the compass table.

Verified never-rises cases from Bucharest (lat 44.4), using the §1 line-member centers: Crux
(dec ≈ -59.31) gives `x = -tan(44.4)·tan(-59.31) ≈ 1.65 > 1`, Carina (dec ≈ -60.70) gives
`x ≈ 1.75 > 1` → both never rise → state 4. This is the §7 state-4 anchor.

### 3.6 Four-state visibility classifier

Thresholds and the compass map are named constants on `AstronomyService`:

```
HORIZON_BAND_DEG   = 3.0    // |alt| <= 3 counts as "at the horizon"
VISIBLE_MIN_DEG    = 3.0    // alt > 3 counts as comfortably visible
```

Classification for the asked constellation at (lat, lon, time):

1. **VISIBLE** — `alt > VISIBLE_MIN_DEG`. Report compass direction + altitude (rounded to whole degrees).
2. **AT_HORIZON** — `|alt| <= HORIZON_BAND_DEG`. "Just rising / sitting low on the `<compass>` horizon."
3. **BELOW_RISES** — `alt < -HORIZON_BAND_DEG` (below the horizon band — the ordered checks below have
   already peeled off VISIBLE and AT_HORIZON) **and** the object does rise here
   (`x = -tan(lat)·tan(dec)` is **not** `> 1`; equivalently it is circumpolar or has a real H0). Report
   "not up right now," the next rise time as a UTC instant plus an "in about N hours" delta (§3.5), and
   the rise compass direction.
4. **NEVER_VISIBLE** — the object never rises from this latitude: `x > 1`, equivalently
   `dec < -(90 - |lat|)` for northern latitudes (symmetric for southern). Clearly say it never rises from
   here; optionally note roughly how far south/north they'd need to travel (`neededLat = -(90 - dec)` sign
   handling). **Give no fake direction.**

States 3 and 4 are decided by the **same closed-form `x` test**, never by a single altitude sample, so
they can't be conflated. The order of checks is: compute `alt`; if `alt > VISIBLE_MIN_DEG` → VISIBLE; else
if `|alt| <= HORIZON_BAND_DEG` → AT_HORIZON; else (alt < -3, below) decide via `x`: `x > 1` →
NEVER_VISIBLE, otherwise BELOW_RISES. (A circumpolar object always has `alt` well above the band, so it
lands in VISIBLE — correct.)

### 3.7 Azimuth → compass table (named constant)

8-point compass, each bin 45° wide centered on the cardinal/intercardinal, boundaries at the half-bin:

```
COMPASS = [N, NE, E, SE, S, SW, W, NW]   // index = round(az / 45) mod 8
```

`N` covers [337.5, 360) ∪ [0, 22.5), `NE` [22.5, 67.5), `E` [67.5, 112.5), `SE` [112.5, 157.5),
`S` [157.5, 202.5), `SW` [202.5, 247.5), `W` [247.5, 292.5), `NW` [292.5, 337.5). Implemented as
`COMPASS[(int)Math.round(az / 45.0) % 8]`.

---

## 4. Constellation name resolution (fuzzy, required)

`SkyChatService` must map free text ("where is the big dipper", "Orion", "find UMa", "scorpius") to one of
the 88 IAU constellations. Approach, in order:

1. **Normalize** the latest user message: lowercase, strip diacritics, collapse whitespace/punctuation.
2. **Direct lookups** against three maps built once at startup from the seeded constellations plus a small
   alias table:
   - full IAU name (case-insensitive) e.g. "orion", "ursa major";
   - 3-letter abbreviation e.g. "ori", "uma";
   - an **alias table** for common/colloquial names and Latin genitives, e.g. `big dipper`/`plough` → UMa,
     `little dipper` → UMi, `scorpius`/`scorpio` → Sco, `the hunter` → Ori. The alias table is a small
     checked-in `Map<String,String>` (alias → abbreviation) in `SkyChatService`.
3. **Token scan**: scan the user text for any constellation name/abbreviation/alias as a whole-word
   substring; if exactly one matches, use it.
4. **Fuzzy fallback**: if no exact token hit, compute Levenshtein distance between the candidate token(s)
   and every name/abbreviation; accept the best match only if normalized distance is within a threshold
   (`FUZZY_MAX_DISTANCE = 2` edits, and the matched token length ≥ 4 to avoid 3-letter false hits). This
   handles typos like "orioon", "casseopeia".
5. **No match** → treat the question as a *general astronomy question*: no `VisibilityFacts`, LLM answers
   normally under the system prompt (which still forbids inventing locational claims).

Levenshtein is implemented locally (tiny DP, no new dependency). The alias table and thresholds are named
constants so they're testable and reviewable.

---

## 5. LLM role and system-prompt contract

The LLM (via existing `GroqService.chat(messages, systemPrompt)` — the private 2-arg overload; expose it
or add a thin public method, see §8) only **phrases** an answer from the structured facts. It must not
compute or invent directions, altitudes, or visibility.

**Transcript handoff (explicit).** `SkyChatService` maps `request.getMessages()` into
`List<Map<String,String>>` exactly as `ConstellationService.chat` already does (each `ChatMessage` →
`{"role": m.getRole(), "content": m.getContent()}`) and passes that **full** running transcript as the
history argument to the new `GroqService` entry point (§8), with the dynamically built FACTS/general
prompt supplied as the `systemPrompt` (system message). It is the whole conversation history that is
sent, not just the last user message — the FACTS live only in the system prompt.

`SkyChatService` builds the system prompt dynamically:

- **When a constellation was resolved**, append a FACTS block the model must use verbatim, e.g.:
  ```
  You are Celestia's sky-map astronomy guide. Answer in 1-3 warm, concise sentences.
  Use ONLY the following computed facts for anything about where the constellation is, whether it is
  visible, its direction, its altitude, or when it rises. NEVER invent or guess directions, altitudes,
  visibility, or rise times. If a fact is not provided, say you don't have it.
  FACTS:
    constellation: Orion (Ori)
    state: VISIBLE
    altitude_deg: 34
    azimuth_deg: 128.5
    compass: SE
    (rise facts only when state is BELOW_RISES)
  Phrase these naturally; do not output JSON or the field names.
  ```
  For `NEVER_VISIBLE`, the FACTS block states it never rises from the user's latitude and the prompt
  explicitly says **do not give any direction**. For `BELOW_RISES`, always include
  `next_rise_in_hours` (e.g. "about 3.5 hours from now") plus `rise_compass`, and include `next_rise_utc`
  (the UTC `...Z` instant) **when available** — in the degraded refinement fallback (§3.5/§6)
  `next_rise_utc` is omitted and only `next_rise_in_hours` is present. The prompt instructs the model to
  phrase the delta ("in about N hours") rather than invent a local wall-clock time, so the phrasing works
  identically whether or not `next_rise_utc` is present.
- **When no constellation was resolved** (general question), use a general astronomy-guide system prompt
  that still forbids making location/visibility claims about any object without provided facts, and keeps
  answers short.

Determinism guarantee: the `reply` text is phrasing only; the authoritative numbers also travel back in
`VisibilityFacts` so the frontend (or tests) can display/verify them independently of the LLM wording.

---

## 6. Error handling (per operation)

| Operation | Failure condition | Recoverable? | Caller receives | Logged |
|-----------|-------------------|--------------|-----------------|--------|
| Request validation (lat/lon/messages — business rules) | out-of-range lat/lon, null/empty messages | fatal for this request | HTTP 400 via `InvalidSkyChatRequestException` → new `GlobalExceptionHandler` branch + `ErrorMessage(400,…)` | warn |
| Request body deserialization (`time` unparseable, or malformed JSON) | `time` string not a valid `date-time`; or body is not valid JSON for the DTO | fatal for this request | HTTP 400 via a new `@ExceptionHandler(HttpMessageNotReadableException.class)` branch + `ErrorMessage(400,…)` — this fires in Spring's message converter *before* `SkyChatService` runs, so the service never sees a raw malformed `time` | warn |
| Name resolution | no match found | recoverable | treated as general question (no `VisibilityFacts`); 200 OK | debug |
| Center lookup | resolved constellation has null `centerRa/centerDec` (seed/back-fill gap) | recoverable | fall back to general-question phrasing; omit `visibility`; 200 OK | warn (indicates seed gap) |
| Astronomy math | none expected (pure arithmetic; `asin`/`acos` inputs clamped) | n/a | — | — |
| Rise-time refinement | no 0-crossing found within search window (shouldn't happen once `x` test passed) | recoverable | report BELOW_RISES; **omit `nextRiseUtc`** but still emit `nextRiseInHours` from the pre-refinement analytic `deltaHours` (rounded, strictly > 0) so the §5 FACTS contract still has a rise delta; phrase it as a UTC-delta ("it will rise within about N hours"), never a wall-clock day part like "tonight" the server cannot know | warn |
| `GroqService` call | network/LLM error | recoverable | `GroqService` already returns a friendly fallback string ("Sorry, something went wrong…"); `visibility` still returned when computed | warn (inside GroqService) |

**Two distinct 400 paths — be precise about which layer each lives in.**

1. **Malformed `time` / malformed JSON body — handled by Spring, NOT the service.** `time` is declared
   `format: date-time`, which the `spring` OpenAPI generator (`interfaceOnly: true`, verified in `pom.xml`)
   maps to `java.time.OffsetDateTime`. A malformed `time` string therefore fails **during Jackson body
   deserialization**, and Spring raises `org.springframework.http.converter.HttpMessageNotReadableException`
   **before** `SkyChatService` is ever invoked — the service can never see a raw malformed `time` string.
   The current `GlobalExceptionHandler` (verified) has **no** handler for `HttpMessageNotReadableException`,
   so today it would fall through to `@ExceptionHandler(Exception.class)` → **HTTP 500**. The implementer
   **must add** a new `@ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)`
   → `HttpStatus.BAD_REQUEST` branch returning the existing `ErrorMessage(400, message)` shape. This makes
   both a malformed `time` and any otherwise-malformed request body return 400, which is the correct
   behavior. (If a future change prefers service-side `time` parsing instead, switch the `time` schema to
   `type: string` and `OffsetDateTime.parse(...)` inside the service in a try/catch that throws
   `InvalidSkyChatRequestException`; this design chooses the handler approach so `time` stays a typed
   `date-time` in the generated DTO.)

2. **Business-rule validation (lat/lon range, empty/null `messages`) — handled by the service.** This lives
   in `SkyChatService` (service layer owns business-rule validation, consistent with the project not using
   bean-validation annotations on generated DTOs). It throws a dedicated `InvalidSkyChatRequestException`
   (new, under `exception/`). `GlobalExceptionHandler` has no branch for this new exception today; it does
   already map `InvalidCredentialsException` → `HttpStatus.BAD_REQUEST` returning `ErrorMessage(400,…)`
   (verified), and that handler is exactly the template to mirror. The implementer **must add** a new
   `@ExceptionHandler(InvalidSkyChatRequestException.class)` → `HttpStatus.BAD_REQUEST` branch returning
   `ErrorMessage(400, message)`.

`time` when absent: use `Instant.now()` (documented).

---

## 7. Testability and unit-test anchors

`AstronomyService` is pure arithmetic → fully **unit-testable** with no Spring context. `SkyChatService`
name resolution is unit-testable (inject a fixed centers map / stubbed repository, no LLM). The HTTP layer
is **integration-testable** with `@WebMvcTest` + a mocked `SkyChatService` (don't hit GroqCloud in tests).
The LLM phrasing itself is not asserted (non-deterministic); tests assert on `VisibilityFacts` instead.

Required unit-test assertions (new `AstronomyServiceTest`), using lat 44.4 / LST 100° where applicable:

1. **Pole → alt ≈ latitude, az ≈ 0 (North).** `altaz(RA=anything, Dec=+90)` → `alt ≈ 44.4` (±0.01),
   `az ≈ 0`.
2. **Meridian at highest → az ≈ 180.** A target with `RA == LST` and `dec < lat` (south of zenith), e.g.
   `Dec = 10` → `az ≈ 180` (South), and `alt ≈ 55.6`.
3. **Zenith → alt ≈ 90.** `RA == LST`, `Dec == lat` → `alt ≈ 90`.
4. **Far-southern constellation from Bucharest → state 4.** Crux (line-member center dec ≈ -59.31)
   classified `NEVER_VISIBLE` from lat 44.4 (because `x = -tan(44.4)·tan(-59.31) ≈ 1.65 > 1`). The
   assertion uses the line-member center value (-59.31), consistent with §1's table and the Appendix
   script.
5. **Currently-below-but-rising → state 3 with a plausible rise time.** Pick a constellation/time where
   `alt < -3` now but `x ≤ 1` (e.g. a near-equatorial constellation currently below the horizon from
   Bucharest); assert state `BELOW_RISES` and that `nextRiseUtc` is a future instant within ~24 h, that
   `nextRiseInHours` is in `(0, 24]`, and that `riseCompass` is a valid 8-point value.
6. **Compass table bins**: `az` 0→N, 90→E, 180→S, 270→W, 135→SE, 350→N (boundary wrap).
7. **LST/JD port**: `toJD`/`getLST` match the frontend for a fixed sample date (compute the frontend value
   once and hard-code it as the expected constant).

`SkyChatServiceTest` (unit): "big dipper" → UMa, "orioon" (typo) → Ori via fuzzy, "ori" → Ori, gibberish →
no match (general question path, null visibility).

`SkyChatIntegrationTest` (`@WebMvcTest`, mocked service): `POST /skymap/chat` with lat/lon/messages returns
200 and the mocked `VisibilityFacts`; missing `latitude` → 400; empty `messages` → 400.

---

## 8. Files to add / change

### Backend — add
- `src/main/resources/constellation-centers.json` — 88 IAU centers `{abbr: {ra, dec}}` (generated; Appendix).
- `src/main/java/org/celestia/backend/service/AstronomyService.java` — JD/LST port, inverse alt/az, rise
  solver, classifier, compass map, named constants.
- `src/main/java/org/celestia/backend/service/SkyChatService.java` — name resolution (alias table +
  fuzzy), orchestration, system-prompt building, request validation.
- `src/main/java/org/celestia/backend/controller/SkyChatController.java` — `@RestController`
  `@RequestMapping("/skymap")`, `POST /chat` → `chatWithSky`.
- Tests: `AstronomyServiceTest`, `SkyChatServiceTest`, `SkyChatIntegrationTest` (under `src/test/java/...`).

### Backend — change
- `src/main/resources/openapi.yaml` — add `SkyChatRequest`, `SkyChatResponse`, `VisibilityFacts` schemas
  and the `/skymap/chat` path (DTOs regenerate on build).
- `src/main/java/org/celestia/backend/model/Constellation.java` — add `centerRa`, `centerDec` (Double).
- `src/main/java/org/celestia/backend/config/ConstellationSeeder.java` — load the centers map first; if
  the collection is empty do the fresh seed with `centerRa/centerDec` set and return; **otherwise run the
  null-`centerRa` back-fill unconditionally** (outside/ahead of the existing `count() > 0` early return,
  which currently returns before any update could execute) and `saveAll` only the mutated subset. Single
  writer of the center fields; idempotent on subsequent startups. See §1 for the exact restructuring.
- `src/main/java/org/celestia/backend/service/GroqService.java` — expose a public phrasing entry point for
  arbitrary `messages + systemPrompt` (either make the private 2-arg `chat(...)` public, or add
  `public String chatRaw(List<Map<String,String>> messages, String systemPrompt)` that wraps it with the
  same try/catch fallback used by the constellation `chat`). Reuses the existing GroqCloud pipeline.
- `src/main/java/org/celestia/backend/exception/GlobalExceptionHandler.java` — **add two** branches,
  mirroring the existing `invalidCredentialsException` 400 handler (which already returns
  `ErrorMessage(400,…)`): (1) `@ExceptionHandler(InvalidSkyChatRequestException.class)` → 400 for
  business-rule validation; (2) `@ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)`
  → 400 so a malformed `time` (which fails Jackson deserialization before the service runs) or any
  malformed JSON body returns 400 instead of falling through to the generic `Exception`→500 handler.
- `src/main/java/org/celestia/backend/exception/InvalidSkyChatRequestException.java` — **add** (new runtime
  exception, same style as `ConstellationNotFound`).
- **Do NOT touch** `application.properties` (groq.api-key already externalized) or `mvnw` — they are
  already-modified working-tree files unrelated to this task; the secret stays out of the diff.
- `src/main/java/org/celestia/backend/config/SecurityConfig.java` — **add** `.requestMatchers("/skymap/**")
  .permitAll()` next to the existing `/constellations/**` permitAll. Verified necessary: the chain ends in
  `anyRequest().authenticated()`, so without this the sky-map chat would be blocked for the anonymous
  users the sky map already serves. This mirrors exactly how `/constellations/**` (and its chat) is
  exposed.

### Frontend — add
- `src/features/skymap/api.js` — `chatWithSky(messages, latitude, longitude, time)` calling
  `request('/skymap/chat', { messages, latitude, longitude, time })` (mirrors
  `constellation/api.js#chatWithConstellation`; the shared `request(path, body)` helper already POSTs JSON
  with credentials/auth headers).
- `src/features/skymap/hooks/useSkyChat.js` — chat state/transcript hook modeled on
  `constellation/hooks/useChat.js`, but calling `chatWithSky` and passing lat/lon/time on every send.
- `src/features/skymap/components/SkyChat.jsx` — the chat panel/widget, styled to match
  `constellation/components/ConstellationChat.jsx` (same dark palette: `rgba(10,14,28,0.97)` panel, accent
  `#4a90d9`, lucide `Sparkles/Send/X`) and the sky-map dark aesthetic; plus a small floating launcher
  button to open it (the sky map is a fullscreen canvas, so the widget opens over it, pointer-events on the
  widget only). When the response carries `visibility.nextRiseUtc` (state BELOW_RISES), any UI chip that
  shows the rise time formats it in the browser's own zone with
  `new Date(visibility.nextRiseUtc).toLocaleString()` — the browser knows the user's real IANA zone, so no
  longitude-based offset guessing happens anywhere. The assistant `reply` text already phrases the "in
  about N hours" delta from the backend facts.

### Frontend — change
- `src/features/skymap/hooks/useSkyMap.js` — capture the lat/lon actually in use (real GPS on success, else
  the Bucharest fallback 44.4/26.1) into React state and **return it** from the hook, alongside the
  existing `{ mountRef, status, tooltip, conNamesRef }`. Currently LAT/LON live only inside the
  `initScene` closure; add `const [coords, setCoords] = useState({ lat: 44.4, lon: 26.1 })` and
  `setCoords({lat, lon})` in both the success and the Bucharest-fallback branches of
  `getCurrentPosition`. **Do not re-prompt for geolocation** and **do not change** any
  azimuth/coordinate/rendering code (`eqVec`, `altAzLookTarget`, horizon labels, builders).
- `src/features/skymap/index.jsx` — consume `coords` from `useSkyMap`, render `<SkyChat lat lon />`; the
  chat sends `time: new Date().toISOString()` per request so the backend computes visibility for the moment
  the user asks. If `coords` is somehow unavailable, default to Bucharest 44.4/26.1 (never block on GPS).

### Constraints honored
- No changes to the sky-map azimuth/coordinate rendering; the feature only **adds** the chat widget and
  the backend math.
- Matches existing controller/service/mapper/DTO-generation conventions.
- Secrets stay out of the diff; no new dependencies; no commit/push; work in-place in the repo.

---

## Appendix — generating `constellation-centers.json`

Run once from `celestia_fe/` to produce the full 88-row file (the exact algorithm the frontend uses for
label placement), keyed by the 88 abbreviations present in `public/data/data/constellations.json`:

The script centroids **only the line-member HIPs** — identical to `buildConstellations` — so the output
coincides with the rendered label (do NOT centroid all `con == abr` stars; that produces a different,
label-mismatched center):

```python
import json, math
stars = json.load(open('public/data/data/stars_full.json'))
fe    = json.load(open('public/data/data/constellations.json'))  # 88 IAU abbrevs, each with .lines (HIP pairs)

byhip = { s['hip']: s for s in stars if s.get('hip') is not None }

out = {}
for abr, con in fe.items():                          # only the canonical 88
    members_hips = { h for pair in con['lines'] for h in pair }   # SAME set buildConstellations uses
    arr = [ byhip[h] for h in members_hips if h in byhip ]
    if len(arr) < 2:                                 # mirrors FE guard `members.length < 2`
        continue
    tw = sum(max(0.1, 6 - s['mag']) for s in arr)
    ss = sum(math.sin(math.radians(s['ra'])) * max(0.1, 6 - s['mag']) for s in arr)
    cs = sum(math.cos(math.radians(s['ra'])) * max(0.1, 6 - s['mag']) for s in arr)
    out[abr] = {
        'ra':  round((math.degrees(math.atan2(ss, cs)) + 360) % 360, 2),
        'dec': round(sum(s['dec'] * max(0.1, 6 - s['mag']) for s in arr) / tw, 2),
    }
json.dump(out, open('../celestia_be/src/main/resources/constellation-centers.json', 'w'), indent=2)
```

The script keys off the 88 FE abbreviations and resolves stars via the HIP index (the same `byHip`
indirection the frontend uses), so the two spurious catalog `con` codes ("Eco", "Sir") never enter — they
are not among the 88 FE keys. Any FE constellation whose line members resolve to fewer than 2 catalog
stars is skipped exactly as the frontend's `members.length < 2` guard skips it (such a constellation would
have no rendered label either).

---

## Responses to design-review findings — Round 1

Review verdict was CHANGES_REQUESTED with 0 HIGH, 1 MEDIUM, 3 NIT. All four are **addressed**; none
backlogged or ignored. The resolutions stay within the original requirements (backend-computed
deterministic visibility, LLM phrasing only, no fake directions, Bucharest fallback, no rendering
changes).

1. **[MEDIUM] `nextRiseLocal` typed as precise `date-time` but computed from a longitude estimate.**
   **Addressed — preferred fix adopted.** Dropped the `localOffsetHours = lon/15.0` math entirely. The
   field is renamed to **`nextRiseUtc`** (`format: date-time`, always a real `...Z` UTC instant) and a new
   zone-independent **`nextRiseInHours`** delta is added to `VisibilityFacts`. §3.5 now states the backend
   never fabricates a civil offset; the frontend formats `nextRiseUtc` in the browser's own IANA zone via
   `toLocaleString()` (§8 frontend `SkyChat.jsx`), and the LLM FACTS carry the UTC instant plus the "in
   about N hours" delta (§5). §7 test anchor updated to assert on `nextRiseUtc`/`nextRiseInHours`.

2. **[NIT] BELOW_RISES condition text conflicts with the ordered algorithm.** **Addressed.** §3.6 state-3
   bullet now reads `alt < -HORIZON_BAND_DEG` **and** `x` not `> 1`, matching the ordered checks (which
   peel off VISIBLE then AT_HORIZON first).

3. **[NIT] `messages` transcript handoff to GroqService implied, not spelled out.** **Addressed.** §5 now
   explicitly states `SkyChatService` maps `request.getMessages()` into `List<Map<String,String>>` exactly
   as `ConstellationService.chat` does (verified against source) and passes the full history to the new
   `GroqService` entry point with the dynamic FACTS/general prompt as the system message.

4. **[NIT] Rise-time fallback used wall-clock "tonight" the server cannot know.** **Addressed.** The §6
   rise-time-refinement fallback row now phrases the degraded path as "it will rise within about N hours"
   (a UTC delta), explicitly omitting `nextRiseUtc` and never committing to a day part like "tonight".

---

## Responses to design-review findings — Round 2

Second review verdict was CHANGES_REQUESTED with 0 HIGH, 2 MEDIUM, 3 NIT. All five are **addressed**; none
backlogged or ignored. Both MEDIUM claims were independently re-verified against source before changing the
design (`useSceneBuilder.js` for the centroid member set, `GlobalExceptionHandler.java` + `pom.xml` for the
exception path), and the new sample/anchor numbers were recomputed from the real catalogs.

1. **[MEDIUM] Centroid "same algorithm as the rendered label" claim was false; Appendix script used a
   different star set.** **Addressed — fix (a) adopted (honor the stated goal).** Verified in
   `useSceneBuilder.js` that `buildConstellations` centroids only the line-member HIPs
   (`[...new Set(con.lines.flat())]`), not all `con == abr` stars. The §1 text now states this explicitly,
   the Appendix script was rewritten to centroid `membersHips = unique(flatten(con.lines))` via the HIP
   index (byte-for-byte the frontend member set and weighting), and the §1 sample table + §3.5 + §7 state-4
   anchor were regenerated with the **actual line-member centroids** (recomputed from `stars_full.json` /
   `constellations.json`): e.g. And 9.27/37.74, Ori 81.92/4.36, Cru 188.65/-59.31, Aps 240.69/-78.57. The
   "coincides with the rendered label" rationale now holds because the center and the label are produced by
   the identical computation. Re-verified the state-4 anchor survives the new numbers:
   `x = -tan(44.4°)·tan(-59.31°) ≈ 1.65 > 1` (Crux) and `≈ 1.75` (Carina) → still NEVER_VISIBLE.

2. **[MEDIUM] "Unparseable `time` → 400" was unachievable (yielded 500).** **Addressed — fix (a) adopted.**
   Verified `time` is `format: date-time` → `OffsetDateTime` (spring generator, `pom.xml`), so a malformed
   value fails in Jackson deserialization (`HttpMessageNotReadableException`) before the service runs, and
   the current `GlobalExceptionHandler` has no such handler → 500. §6 now splits the two 400 paths
   explicitly: (1) a new `@ExceptionHandler(HttpMessageNotReadableException.class)` → 400 for malformed
   `time`/JSON (caught by Spring, not the service), and (2) `InvalidSkyChatRequestException` → 400 for
   service-side business-rule validation (lat/lon range, empty `messages`). §2's request-contract table and
   §8's `GlobalExceptionHandler` change were updated to add **both** handlers. The `time` schema stays a
   typed `date-time`.

3. **[NIT] "`GlobalExceptionHandler` has no 400/validation branch today" was inaccurate.** **Addressed.**
   §6 reworded: the handler already maps `InvalidCredentialsException` → 400 (returning `ErrorMessage(400,…)`,
   verified), and that is explicitly named as the template to mirror for the new
   `InvalidSkyChatRequestException` branch. The false "no 400 branch" claim is removed.

4. **[NIT] Seeder back-fill placement vs the `count() > 0` early return was ambiguous.** **Addressed.** §1
   and §8 now specify the restructuring precisely: load the centers map first; if `count() == 0` do the
   fresh seed with centers and `return`; **else run the null-`centerRa` back-fill unconditionally** (ahead
   of / independent of the early return) and `saveAll` only the mutated subset. Verified against the current
   seeder that a back-fill left after the early `return` would be dead code on already-seeded DBs.
   `ConstellationSeeder` is named the single writer of the center fields; the back-fill is idempotent.

5. **[NIT] `nextRiseInHours` in the degraded rise fallback was unspecified.** **Addressed.** §3.5 and the §6
   fallback row now state one rule: in the degraded path emit `nextRiseInHours` from the pre-refinement
   analytic `deltaHours` (rounded, strictly > 0) and omit `nextRiseUtc`; `nextRiseInHours` is therefore
   always present for BELOW_RISES and strictly positive by construction. §5's FACTS contract was updated so
   `next_rise_utc` is "included when available" while `next_rise_in_hours` is always included, and the
   prompt phrases the delta identically in both paths.
