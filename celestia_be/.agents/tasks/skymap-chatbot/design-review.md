# Design Review — Sky Map Astronomy Chatbot

Reviewed document: `.agents/tasks/skymap-chatbot/design.md` (Round 3 state, after two prior review rounds).
Review method: read the design fresh, then verified every load-bearing claim against the actual
backend/frontend source and re-derived the numeric anchors independently.

**Verdict: APPROVED** — 0 HIGH, 0 MEDIUM findings. The findings below are all NIT and do not block.

---

## Findings

1. **[NIT] Sidereal-to-solar conversion factor is stated without derivation.**
   §3.5 computes `deltaHours = deltaLstDeg / 15.0 * (1 / 1.0027379)`. The factor is correct (sidereal
   degrees → sidereal hours via `/15`, then sidereal hours → solar hours via `/1.0027379`), but the design
   never says what `1.0027379` is. Concrete fix: add a one-line comment at the implementation site, e.g.
   `// 1.0027379 = mean sidereal days per solar day; converts the sidereal LST gap to elapsed solar time`.
   This is purely documentary; the math is right and the §7 anchor (nextRiseInHours in (0,24]) still holds.

2. **[NIT] `SkyChatResponse.visibility` "nullable" is a comment, not schema — confirm optional-omit semantics.**
   The spec is OpenAPI `3.0.1` (verified in `openapi.yaml`), where sibling keywords next to a `$ref`
   (including `nullable: true`) are ignored by the generator. The design's "`# nullable: only present…`" is
   just a comment, so the generated field is simply optional and the service omits it when there is no
   resolved constellation — which is the intended behavior. Concrete fix: keep it as an omittable property
   (do not try to add `nullable: true` beside the `$ref`, as it would be silently dropped); the frontend
   must treat `visibility === undefined/null` as "no facts," which §8's `SkyChat.jsx` already assumes.

3. **[NIT] `riseCompass` in `VisibilityFacts` has no `example` and its schema entry is terse.**
   Every other field carries an `example`/description; `riseCompass` only says "Present only for state
   BELOW_RISES." Concrete fix: add `type: string` is already implied — add `example: E` and note it is an
   8-point compass value, for consistency and clearer generated docs.

4. **[NIT] Dead-letter for `con` codes "Eco"/"Sir" is explained only in the Appendix, not in §1.**
   The Appendix correctly keys off the 88 FE abbreviations so spurious catalog `con` codes never enter, and
   I verified `stars_full.json` does contain non-88 `con` values (e.g. `null` for Sol). This is fine, but a
   reader of §1 alone might expect all catalog `con` codes. Concrete fix: add one sentence to §1 pointing at
   the Appendix guard ("the table is built from the 88 FE `constellations.json` keys, not from catalog
   `con` tags, so stray tags are excluded").

---

## Verified Assumptions

All verified against source on disk at review time.

- **DTO mechanism is OpenAPI-generated into `org.celestia.generated.model`.** `pom.xml` configures
  `openapi-generator-maven-plugin` 7.5.0, `generatorName: spring`, `interfaceOnly: true`,
  `modelPackage: org.celestia.generated.model`. `ConstellationController` imports `ChatRequest`/
  `ChatResponse` from that package. The design's "add schemas + path to `openapi.yaml`, do not hand-roll"
  is exactly the existing mechanism. ✓
- **`ChatMessage` schema exists** (`{role, content}`, both required) and is reused by `ChatRequest`.
  The design reuses it for `SkyChatRequest.messages`. ✓
- **`format: date-time` → `OffsetDateTime`** under the spring generator, and existing DTOs already use
  `date-time` (`UserResponse.createdAt`, `HistoryEntryResponse.createdAt`), so JSR-310 deserialization is
  already active in this app. A malformed `time` therefore fails in Jackson deserialization
  (`HttpMessageNotReadableException`) before the service runs — exactly as §6 claims. ✓
- **`GlobalExceptionHandler` has `InvalidCredentialsException` → 400** returning `ErrorMessage(400, msg)`,
  and has **no** `HttpMessageNotReadableException` handler, so a malformed body currently falls through to
  `@ExceptionHandler(Exception.class)` → 500. The design's "add two 400 branches, mirror the credentials
  handler" is accurate. `ErrorMessage` is a `record (int status, String message)`, so `ErrorMessage(400,…)`
  is valid. ✓
- **`ConstellationNotFound extends RuntimeException`** — the exact style the new `InvalidSkyChatRequestException`
  is told to mirror. ✓
- **`ConstellationSeeder.run` returns early on `count() > 0`** and only `saveAll`s on a fresh load; it never
  updates existing docs. The design's "a back-fill after the early return is dead code; restructure to
  back-fill unconditionally" is correct. ✓
- **`Constellation` model has no RA/Dec fields** and the backend seed `constellations.json` has **0**
  occurrences of ra/dec/rightAscension/declination (grep verified). Adding `centerRa`/`centerDec` as
  Lombok `@Getter/@Setter` Doubles matches the model's style. ✓
- **`SecurityConfig` ends in `anyRequest().authenticated()`** with `/constellations/**` permitAll; adding
  `/skymap/**` permitAll is necessary and mirrors the existing pattern. ✓
- **Centroid algorithm matches `buildConstellations` in `useSceneBuilder.js` byte-for-byte**:
  `members = [...new Set(con.lines.flat())].map(h => byHip[h]).filter(Boolean)`, `members.length < 2` skip,
  weight `max(0.1, 6 - mag)`, `atan2(sinSum, cosSum)` RA vector sum normalized to `[0,360)`, weighted mean
  Dec. The Appendix script reproduces this exactly over the line-member HIP set. ✓
- **RA axis is in degrees everywhere.** `stars_full.json` `ra` values span 0–~360 (e.g. 0.005, 0.0373), and
  `useSkyMap.js` feeds `getLST(...)` (which returns degrees) straight into `eqVec` as the RA argument. ✓
- **`getLST` returns degrees** and horizon labels use `DIRS = [['N',0],['E',90],['S',180],['W',270]]`
  (`buildHorizonLabels`), confirming azimuth is measured North-through-East — the convention the inverse in
  §3.3 targets. ✓
- **Inverse RA/Dec → alt/az numeric anchors (independently recomputed, lat 44.4 / LST 100°):**
  zenith → alt 90.0/az 0.0; pole (Dec +90) → alt 44.4/az 0.0; meridian Dec 10 → alt 55.6/az 180.0;
  meridian Dec 70 → alt 64.4/az 0.0. All match §3.4. ✓
- **Inverse is consistent with the frontend `altAzLookTarget`:** round-tripping FE alt/az → RA/Dec → inverse
  alt/az across all four azimuth quadrants (az 45/135/200/300/90) returns the original alt/az to <0.01°,
  confirming §3.3's azimuth convention agrees with the rendered compass. ✓
- **Never-rises `x` values (recomputed):** Crux (dec −59.31) `x = 1.65 > 1`; Carina (dec −60.70) `x = 1.745`.
  Both NEVER_VISIBLE from lat 44.4 — matches the §7 state-4 anchor. ✓
- **Compass bins (recomputed):** az 0→N, 90→E, 180→S, 270→W, 135→SE, 350→N. Matches §3.7. ✓
- **`toJD`/`getLST` port** matches `astronomy.js` character-for-character (Math.floor flooring, GMST
  polynomial, double-mod `[0,360)` normalization). ✓
- **Transcript handoff**: `ConstellationService.chat` maps `request.getMessages()` to
  `List<Map<String,String>>` with `role`/`content` keys, exactly as §5 describes for `SkyChatService`. ✓
- **`GroqService` shape**: public `chat(constellationName, history)`; private 2-arg
  `chat(messages, systemPrompt)`. §5/§8's "expose the 2-arg overload or add a `chatRaw` wrapper" is accurate,
  and the existing method already provides the friendly-fallback try/catch the design relies on. ✓
- **Frontend plumbing**: `request(path, body)` POSTs JSON with credentials + auth headers;
  `chatWithConstellation(name, messages)` calls `request('/.../chat', { messages })`;
  `useChat.js` builds `[{role, content}]`; `useSkyMap.js` returns `{ mountRef, status, tooltip, conNamesRef }`
  and falls back to Bucharest 44.4/26.1 on GPS failure; `index.jsx` destructures those four fields. The
  design's additive changes (return `coords`, render `<SkyChat>`) match the current code. ✓
- **FE `constellations.json`** is keyed by abbreviation with `.name` and `.lines` (HIP pairs), so the
  Appendix script's `fe.items()` iteration is correct; backend seed `constellations.json` is an array of
  objects each with `abbreviation`, so lookup-by-abbreviation in the seeder is valid. ✓
- **Chat UI palette** (`rgba(10,14,28,0.97)`, accent `#4a90d9`, lucide `Sparkles/Send/X`) matches
  `ConstellationChat.jsx`, as §8 claims for `SkyChat.jsx`. ✓

## Unverified / Wrong Assumptions

- **None material.** No claim in the design was found to be wrong or unverifiable against the source.
- Not independently checked (acceptable — these are generated or produced during implementation, not design
  claims): the exact 88-row contents of the to-be-generated `constellation-centers.json` beyond the dozen
  sample rows (the Appendix script is the source of truth and was validated for algorithm, not row-by-row
  output), and the live GroqCloud response wording (explicitly not asserted; tests assert on
  `VisibilityFacts`, per §7).
