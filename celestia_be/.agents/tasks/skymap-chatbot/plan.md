# Implementation Plan — Sky Map Astronomy Chatbot

Realizes the approved design at `.agents/tasks/skymap-chatbot/design.md`. Work in-place in the repo
(no worktree). Only ADD; do not change existing azimuth/coordinate rendering. Do not touch
`application.properties` or `mvnw` (already-modified, unrelated). Keep secrets out of the diff.
Do not commit or push.

Backend root: `/Users/dariacraciun/Desktop/icusi 2026/app/Celestia/celestia_be`
Frontend root: `/Users/dariacraciun/Desktop/icusi 2026/app/Celestia/celestia_fe`

Backend verify: `./mvnw -q -DskipTests package` (or `./mvnw compile`) from the backend root; run tests with
`./mvnw -q -Dtest=AstronomyServiceTest,SkyChatServiceTest,SkyChatIntegrationTest test`.
Frontend verify: `npm run build` from the frontend root. Never start the dev server.

Ordering note: the OpenAPI schemas (item 1) must land first because the controller/service/tests consume
the generated DTOs (`org.celestia.generated.model.SkyChatRequest/SkyChatResponse/VisibilityFacts`). The
`AstronomyService` (item 3) has no project dependencies and could be built in parallel, but is sequenced
after the DTOs so every item leaves the tree buildable.

---

- [ ] 1. Add the OpenAPI schemas and path so the DTOs generate. In `src/main/resources/openapi.yaml`
      add the `/skymap/chat` path (`operationId: chatWithSky`, tag `SkyMap`, requestBody `SkyChatRequest`,
      200 → `SkyChatResponse`) and three schemas: `SkyChatRequest` (`messages` array of the existing
      `ChatMessage`, required; `latitude`/`longitude` doubles, required; optional `time` as
      `format: date-time`), `SkyChatResponse` (`reply` string, nullable `visibility` → `VisibilityFacts`),
      and `VisibilityFacts` (`constellation`, `abbreviation`, `state`, `altitudeDeg`, `azimuthDeg`,
      `compass`, `nextRiseUtc` as date-time, `nextRiseInHours` double, `riseCompass`). Reuse the existing
      `ChatMessage` schema; do not hand-write DTO classes. Follow §2 of the design verbatim.
      Files: `src/main/resources/openapi.yaml`
      Verify: `./mvnw -q -DskipTests package` from the backend root succeeds and generates
      `org.celestia.generated.model.SkyChatRequest`, `SkyChatResponse`, `VisibilityFacts` under
      `target/generated-sources`.

- [ ] 2. Add the center fields to the model and seed them. Add `private Double centerRa;` and
      `private Double centerDec;` (Lombok `@Getter/@Setter`, nullable) to `Constellation.java`. Generate
      `src/main/resources/constellation-centers.json` with the Appendix script (centroid of the
      line-member HIPs from `celestia_fe/public/data/data/stars_full.json` +
      `celestia_fe/public/data/data/constellations.json`, weight `max(0.1, 6 - mag)`, RA via sin/cos
      vector sum normalized to `[0,360)`, skip constellations with <2 resolvable members). Restructure
      `ConstellationSeeder.run` per §1: load the centers map first; if `count() == 0` do the fresh seed
      with `centerRa/centerDec` set from the map by abbreviation and `return`; else back-fill every
      document whose `centerRa` is null and `saveAll` only the mutated subset. The seeder is the single
      writer of these fields; the back-fill is idempotent.
      Files: `src/main/java/org/celestia/backend/model/Constellation.java`,
      `src/main/resources/constellation-centers.json`,
      `src/main/java/org/celestia/backend/config/ConstellationSeeder.java`
      Verify: `./mvnw -q -DskipTests package` compiles; spot-check `constellation-centers.json` has 88
      (or near-88, minus any <2-member skips) entries and that the sample anchors match the design table
      (And 9.27/37.74, Ori 81.92/4.36, Cru 188.65/-59.31) within rounding.

- [ ] 3. Create `AstronomyService` with the ported math and classifier. New `@Service` with instance
      methods: `toJD(Instant/OffsetDateTime)` and `getLST(jd, lon)` ported verbatim from `astronomy.js`
      (both in degrees, `Math.floor` matching JS); the inverse `altAz(ra, dec, lst, lat)` returning
      `(alt, az)` with azimuth North-through-East; the closed-form rise-time solver
      (`x = -tan(lat)·tan(dec)`; `x>1` never rises, `x<-1` circumpolar, else `H0 = acos(x)` →
      `deltaLstDeg` → `deltaHours` with the 1.0027379 sidereal ratio → `nextRiseUtc`, then ±minutes
      refinement; degraded fallback emits `nextRiseInHours` from analytic `deltaHours` and omits
      `nextRiseUtc`); the four-state classifier (VISIBLE / AT_HORIZON / BELOW_RISES / NEVER_VISIBLE) in
      the §3.6 order using named constants `HORIZON_BAND_DEG=3.0`, `VISIBLE_MIN_DEG=3.0`; and the 8-point
      compass map `COMPASS[(int)Math.round(az/45.0)%8]`. Expose a struct/record of visibility facts for
      `SkyChatService` to map into `VisibilityFacts`.
      Files: `src/main/java/org/celestia/backend/service/AstronomyService.java`
      Verify: `./mvnw -q -DskipTests package` compiles (unit tests added in item 7).

- [ ] 4. Expose a GroqService phrasing entry point. Either make the private 2-arg
      `chat(List<Map<String,String>> messages, String systemPrompt)` public, or add
      `public String chatRaw(List<Map<String,String>> messages, String systemPrompt)` that wraps it with
      the same try/catch fallback (`"Sorry, something went wrong. Please try again."`) used by the
      existing constellation `chat`. Do not change the existing public `chat(constellationName, history)`
      behavior.
      Files: `src/main/java/org/celestia/backend/service/GroqService.java`
      Verify: `./mvnw -q -DskipTests package` compiles.

- [ ] 5. Add the exception and both GlobalExceptionHandler branches. Add
      `InvalidSkyChatRequestException` (runtime, same style as `ConstellationNotFound`). In
      `GlobalExceptionHandler` add two `@ExceptionHandler` branches returning
      `new ErrorMessage(400, e.getMessage())` with `HttpStatus.BAD_REQUEST`, mirroring the existing
      `invalidCredentialsException` branch: one for `InvalidSkyChatRequestException` (business-rule
      validation) and one for `org.springframework.http.converter.HttpMessageNotReadableException`
      (malformed `time`/JSON body — fires in Jackson before the service).
      Files: `src/main/java/org/celestia/backend/exception/InvalidSkyChatRequestException.java`,
      `src/main/java/org/celestia/backend/exception/GlobalExceptionHandler.java`
      Verify: `./mvnw -q -DskipTests package` compiles.

- [ ] 6. Create `SkyChatService` and wire the controller + security. New `@Service` that: validates
      the request (lat ∈ [-90,90], lon ∈ [-180,180], non-empty `messages`; throw
      `InvalidSkyChatRequestException` on failure); fuzzy-resolves the constellation (normalize → direct
      name/abbr/alias maps built from the seeded constellations + a checked-in alias table → whole-word
      token scan → Levenshtein fallback `FUZZY_MAX_DISTANCE=2`, token length ≥4; no match → general
      question, null visibility); on a resolved constellation with non-null `centerRa/centerDec` calls
      `AstronomyService` for facts and builds the dynamic FACTS system prompt (§5), else falls back to a
      general astronomy-guide prompt; maps `request.getMessages()` into `List<Map<String,String>>` exactly
      as `ConstellationService.chat` does and passes the full transcript + system prompt to the GroqService
      entry point from item 4; returns `SkyChatResponse` with `reply` and the computed `VisibilityFacts`
      (or null). Add `SkyChatController` (`@RestController @RequestMapping("/skymap")`, `POST /chat` →
      `chatWithSky`) mirroring `ConstellationController`. Add `.requestMatchers("/skymap/**").permitAll()`
      next to the existing `/constellations/**` line in `SecurityConfig`.
      Files: `src/main/java/org/celestia/backend/service/SkyChatService.java`,
      `src/main/java/org/celestia/backend/controller/SkyChatController.java`,
      `src/main/java/org/celestia/backend/config/SecurityConfig.java`
      Verify: `./mvnw -q -DskipTests package` compiles.

- [ ] 7. Add the backend tests. `AstronomyServiceTest` (pure unit): pole Dec=+90 → alt≈lat (44.4) &
      az≈0; RA==LST meridian Dec=10 → az≈180 & alt≈55.6; zenith RA==LST Dec==lat → alt≈90; Crux
      (dec≈-59.31) from lat 44.4 → NEVER_VISIBLE; a near-equatorial constellation currently below the
      horizon with x≤1 → BELOW_RISES with `nextRiseUtc` a future instant within ~24h, `nextRiseInHours`
      in (0,24], valid `riseCompass`; compass bins (0→N, 90→E, 180→S, 270→W, 135→SE, 350→N); JD/LST match
      a hard-coded frontend-computed sample. `SkyChatServiceTest` (unit, stubbed repository + mocked
      GroqService): "big dipper"→UMa, "orioon"→Ori (fuzzy), "ori"→Ori, gibberish→no match/null
      visibility. `SkyChatIntegrationTest` (`@WebMvcTest(SkyChatController.class)` excluding security auto-
      config, mocked `SkyChatService`, mirroring `AuthControllerTest`): POST returns 200 with mocked facts;
      missing `latitude`→400; empty `messages`→400.
      Files: `src/test/java/org/celestia/backend/service/AstronomyServiceTest.java`,
      `src/test/java/org/celestia/backend/service/SkyChatServiceTest.java`,
      `src/test/java/org/celestia/backend/controller/SkyChatIntegrationTest.java`
      Verify: `./mvnw -q -Dtest=AstronomyServiceTest,SkyChatServiceTest,SkyChatIntegrationTest test` passes.

- [ ] 8. Add the frontend chat API + hook. Create `src/features/skymap/api.js` with
      `chatWithSky(messages, latitude, longitude, time)` → `request('/skymap/chat', { messages, latitude,
      longitude, time })` (mirrors `constellation/api.js`). Create
      `src/features/skymap/hooks/useSkyChat.js` modeled on `constellation/hooks/useChat.js` but calling
      `chatWithSky` and passing `lat/lon` plus `time: new Date().toISOString()` on every send; keep the
      assistant greeting and transcript handling.
      Files: `src/features/skymap/api.js`, `src/features/skymap/hooks/useSkyChat.js`
      Verify: `npm run build` from the frontend root succeeds.

- [ ] 9. Add the SkyChat panel component. Create `src/features/skymap/components/SkyChat.jsx` styled to
      match `ConstellationChat.jsx` (panel `rgba(10,14,28,0.97)`, accent `#4a90d9`, lucide
      `Sparkles/Send/X`) with a floating launcher button that opens the widget over the fullscreen canvas
      (pointer-events only on the widget). Accept `lat`/`lon` props. When a response carries
      `visibility.nextRiseUtc`, any rise-time chip formats it via
      `new Date(visibility.nextRiseUtc).toLocaleString()` (browser's own zone — no offset guessing).
      Files: `src/features/skymap/components/SkyChat.jsx`
      Verify: `npm run build` from the frontend root succeeds.

- [ ] 10. Thread lat/lon from useSkyMap and mount the chat. In `useSkyMap.js` add
      `const [coords, setCoords] = useState({ lat: 44.4, lon: 26.1 })`, call `setCoords({lat, lon})` in
      both the geolocation success branch and the Bucharest-fallback branch (do NOT re-prompt for
      geolocation; do NOT change `eqVec`, `altAzLookTarget`, horizon labels, or any rendering/builder
      code), and return `coords` alongside the existing `{ mountRef, status, tooltip, conNamesRef }`. In
      `index.jsx` consume `coords` and render `<SkyChat lat={coords.lat} lon={coords.lon} />`, defaulting
      to Bucharest 44.4/26.1 if `coords` is unavailable.
      Files: `src/features/skymap/hooks/useSkyMap.js`, `src/features/skymap/index.jsx`
      Verify: `npm run build` from the frontend root succeeds.

- [ ] 11. Final integration verification. Run the full backend build+tests and the frontend build
      together to confirm the seams hold.
      Files: (none)
      Verify: `./mvnw -q -DskipTests package` and
      `./mvnw -q -Dtest=AstronomyServiceTest,SkyChatServiceTest,SkyChatIntegrationTest test` from the
      backend root both pass, and `npm run build` from the frontend root succeeds. Confirm the git diff
      does not include `application.properties` or `mvnw`, and that no secret appears in the diff.
