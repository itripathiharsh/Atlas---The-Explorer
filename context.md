# context.md — Project Memory

> **AGENTS: read `RULES.md`, `PLAN.md`, and this file at session start.
> Update this file (iteration entry + Current State) at session end. Do not work from memory alone.**

---

## Current State (updated: Iteration 10)

- **What works:** everything from iteration 5, plus the three floating map
  buttons are fully functional with clear feedback (see iteration 6).
- **How to run:** `powershell -File scripts\setup_db.ps1` → seed via
  `backend\.venv\Scripts\python.exe scripts\seed_db.py` →
  `powershell -File scripts\dev.ps1`. App at https://localhost:5173 (LAN: same
  URL with machine IP; HTTPS is auto-enabled in dev for phone geolocation).
- **Not yet done (needs a human outside):** PRD §40's physical walk (steps 5–8)
  with a real phone; PWA icon PNGs (SVG only for now); code-splitting the 1 MB
  maplibre bundle.
- **Next milestone:** owner feedback from first real play.

---

## Iteration Log

## Iteration 10 — 2026-10-06 — owner: brand logo + UI re-theme
- **Milestone:** polish (owner-provided brand asset)
- **Asset:** `logo\Atlas main logo.png` — navy + ivory "ATLAS — Explore · Unlock · Discover".
- **Done:**
  - Extracted exact brand colors with Pillow: navy `#061623`, ivory `#fcf8f0`.
  - Generated assets: emblem crop (gap-detected, clean) → `public\icons\icon-{512,192,64,32}.png`;
    full lockup → `public\logo.png`; favicon, apple-touch-icon, PWA manifest
    (192/512) all now use the logo; theme-color → navy.
  - Re-themed the entire UI: `lime` token renamed to `brand` across src, values
    replaced (navy void, ivory accents, warm-gray mute); map reveal fill/lines,
    pin sprites, me-marker, XP glow, HUD level badge (cream gradient, navy
    numeral), buttons/chips/onboarding hexes — all navy/ivory now. Auth screen
    wears the emblem + "Explore · Unlock · Discover" lockup.
  - Port fix discovered mid-pass: port 8000 was taken over by the owner's other
    project (a movie app) → ATLAS backend moved to **8014** (vite proxy,
    dev.ps1, README). The other project was left untouched.
- **Verified:** build clean; full screenshot pass on http (shots 01–07) — auth,
  onboarding, fog map, sheet, profile all in brand. QA scripts' selectors
  updated for the renamed `btn-brand` class.
- **Commit:** see git log

## Iteration 9 — 2026-10-06 — owner feedback: "reveal nearby does nothing; how to add my location"
- **Milestone:** polish (owner-reported, testing from Mairwa — outside the seeded city)
- **Fixed:**
  - "Reveal what's nearby" CTA now opens the Discoveries-nearby list (was only
    nudging the camera — invisible effect).
  - NearbySheet empty state gained a "Take me to Lucknow instead" jump.
  - **Desktop demo mode**: `GPS_DEV_MODE=true` in `.env` relaxes the 50 m GPS
    gate to 5 km so the whole loop is playable from a laptop; default stays
    strict. Tests pin strict mode via conftest and a dedicated test covers the
    relaxed path (37/37 green).
  - New `GET /api/config` (auth) exposes the server's verification thresholds —
    the frontend now uses them instead of duplicated magic numbers.
  - Found + fixed: the running uvicorn had NOT hot-reloaded (stale code served —
    /api/config 404'd); restarted it. Rule for the future: backend .env changes
    need a manual uvicorn restart.
- **Verified** (`web\scripts\verify_mairwa.mjs`, shots 30–34): from Mairwa with
  800 m-accuracy GPS → cell unlocked (+10 XP, hex revealed) → nearby list empty
  state → "Take me to Lucknow" → Lucknow list fills → created "Mairwa Ghat at
  dusk" via + → appears at 0 m in the nearby list with its pin on the map.
- **Commit:** see git log

## Iteration 8 — 2026-10-06 — owner feedback: "check whether the sheet actions work"
- **Milestone:** polish (owner-reported)
- **Feedback (owner, screenshot):** detail sheet showed "Could not get your
  location" when tapping "I'm here — mark visited" from the desktop.
- **Root cause:** the visit flow re-acquired GPS from scratch via
  getCurrentPosition, which often fails on desktops — while the map's
  watchPosition tracker already had a live fix the whole time. Also the sheet
  showed distance from the *map view*, not from the user.
- **Fixed:**
  - Check-in now reuses the live tracked fix (fresh <20 s) and only falls back
    to a fresh GPS read when there isn't one.
  - Sheet distance is computed client-side from the user's actual position
    (display-only; the server still enforces the 150 m rule).
  - Distance gate: >150 m replaces the check-in button with "Walk closer to
    check in" instead of letting a doomed request fire.
  - Distance formatting: km beyond 1000 m.
- **Verified end to end** (`web\scripts\verify_sheet.mjs`, screenshots
  data\shots\20–25): standing at Begum Hazrat Mahal Park → mark visited
  (+15 XP, "Visited ✓", EXPLORED count +1) → worth visiting (+20 XP, gold
  "Recommended", RECOMMENDED +1, "Worth it" 75%→100%) → photo upload (thumb
  appears) → report submitted ("Report sent — thank you"). Far case
  (Mairwa, 338 km): check-in correctly gated with "Walk closer".
  Also verified: at Mairwa the nearby list correctly shows its empty state.
- **Commit:** see git log

## Iteration 7 — 2026-10-06 — owner feedback: cert error in the in-app browser
- **Milestone:** polish (owner-reported)
- **Feedback (owner, screenshot):** "This site's HTTPS certificate is not
  trusted" (ERR_CERT_AUTHORITY_INVALID) when opening the app.
- **Diagnosis:** dev server ran with a self-signed cert (for LAN phone testing);
  the ZCode in-app browser has no "proceed anyway" bypass. But localhost is a
  secure context per spec — desktop use never needed HTTPS.
- **Fixed:** `npm run dev` is now plain HTTP (no cert friction on desktop);
  `npm run dev:host` enables HTTPS for phone-over-LAN testing (real mobile
  browsers offer Advanced → Proceed). Restarted the dev server on HTTP;
  verified `isSecureContext === true` and working geolocation on
  http://localhost:5173 (data\shots\10).
- **Commit:** see git log

## Iteration 6 — 2026-10-06 — owner feedback: map buttons not functional
- **Milestone:** polish (owner-reported)
- **Feedback (owner, with screenshot):** the floating map buttons (+, crosshair,
  pin) "are not functionally working".
- **Diagnosis:** pin button was decorative (never wired — bug); + and crosshair
  silently disabled without a GPS fix; on desktop, Wi-Fi positioning gives
  ~800 m+ accuracy and the client dropped all fixes > 200 m, so on desktop the
  buttons were permanently dead with no explanation.
- **Fixed:**
  - Pin button → opens a **NearbySheet**: discoveries around the current map
    view (not just around you), sorted by distance, tap → detail + fly-to.
  - MapCanvas now reports viewport center (`onMove`, rAF-throttled).
  - + and crosshair never silently dead: tapping without a fix shows a toast
    ("Finding your location…" / "Location blocked — enable GPS").
  - Client accepts any sane accuracy (≤10 km) so desktop users see their rough
    position; the server still enforces the real thresholds.
  - Create-discovery sheet: inline amber warning when accuracy > 45 m and
    publish disabled with the reason shown (instead of a mystery server error).
  - Weak-GPS unlock toast rate-limited to once per 45 s (was every ping).
  - Escape closes the top-most sheet (desktop nicety).
- **Verified:** build clean; headless-Edge probes of nearby list + weak-GPS
  create state (data\shots\08, 09).
- **Commit:** see git log

## Iteration 5 — 2026-10-06 — M2–M8: full frontend + visual QA pass
- **Milestone:** M2–M8
- **Done:** Complete React PWA: auth screen, 3-step onboarding, MapLibre map
  with fog-of-war reveal (dark basemap + lime hex fills + unlock pulse
  animation), HUD (level hex + XP bar), stats dock, discovery bottom sheet
  (visit/recommend/photos/report), create-discovery sheet, profile sheet
  (stats, city %, achievements), XP/achievement/level-up FX, geolocation hook
  + 4s batched ping loop. Screenshot QA pipeline (`web\scripts\shot.mjs`,
  system Edge + simulated GPS walk, nothing installed to C:). Fixed in the
  process: maplibre container size (Tailwind v4 layer vs unlayered CSS — inline
  style wins), CARTO free tiles dead → switched to OpenFreeMap dark (keyless),
  geolocation permission override, preserveDrawingBuffer for headless shots.
- **Decided:**
  - Basemap: OpenFreeMap "dark" vector style (free, keyless); MapTiler via
    `VITE_MAPTILER_KEY` is the upgrade path (D8 update — CARTO raster tiles now
    watermark "API KEY REQUIRED").
  - Reveal style: fill #b8e83c at 0.34→0.24 opacity by zoom + luminous edge
    line; pulse = #eaff9e flash on unlock.
  - App name: **ATLAS** ("The world starts unexplored. Walk to reveal it.").
- **Not working / known issues:** bundle is ~1 MB (maplibre) — fine for MVP,
  code-split later; PWA icons are SVG-only; onboarding hex grid animation is
  decorative; discovery "Worth visiting" requires a visit (by design).
- **Next:** real-phone walk test (PRD §40), then owner feedback.
- **Commit:** see git log

## Iteration 4 — 2026-10-06 — M4–M7 backend: discoveries, social, safety
- **Milestone:** M4–M7
- **Done:** discoveries (nearby haversine, detail, create with presence proof +
  5/day rate limit), verified visits (150 m gate, +15 XP once), recommendations
  (gated on visit, unique, score = recs/visitors), photo uploads (type/size
  validated → data\uploads, served at /uploads), reports, admin endpoints
  (reports queue, discovery status, ban), achievements evaluation on every XP
  event. 34/34 tests passing.
- **Decided:** DiscoveryIn carries both the player fix (`fix_lat/fix_lng`) and
  the pinned position (pin may be ≤300 m from the player); photos default to
  approved (admin can reject) for MVP; seed = 44 curated Lucknow places.
- **Not working / known issues:** none.
- **Next:** frontend.
- **Commit:** see git log

## Iteration 3 — 2026-10-06 — M3 backend: exploration engine
- **Milestone:** M3
- **Done:** `/exploration/ping` (batch ≤20 fixes) with the full verification
  pipeline (accuracy ≤50 m, stale ≤5 min, speed ≤160 km/h for gaps ≥1 s,
  coordinate schema), H3 res-8 unlock + XP + level curve, `xp_events` audit
  log, `/map/explored` (GeoJSON) + `/map/summary`, `/me/stats`,
  `/me/achievements`, achievements seeding, Lucknow city boundary + 594-cell
  polyfill seeding. 20/20 tests at this point.
- **Decided:** speed check only applies to fix gaps ≥1 s (same-burst fixes
  would imply absurd velocities); cells get city assignment at creation via
  point-in-polygon; `xp_events.ref_id` is BIGINT (h3 indices overflow INT32).
- **Not working / known issues:** none.
- **Next:** M4–M7 backend.
- **Commit:** see git log

## Iteration 2 — 2026-10-05 — M1: auth & users
- **Milestone:** M1
- **Done:** JWT auth (register/login, bcrypt, PyJWT), `GET /me`, deps
  (get_current_user/admin), schemas; 8 backend tests passing (auth success/dup/
  invalid/reject paths + health).
- **Decided:** tests run against a real Postgres (`worldgame_test` DB, created and
  dropped per run by conftest) — server is the real deal, no SQLite.
- **Not working / known issues:** none.
- **Next:** M2 — web app.
- **Commit:** see git log

## Iteration 1 — 2026-10-05 — M0: foundation
- **Milestone:** M0
- **Done:** portable PostgreSQL 16.9 downloaded and extracted to `tools\pg`
  (gitignored); cluster initialized at `data\pg` (D: only); FastAPI skeleton with
  `/health`; pytest + conftest harness (real test DB); Alembic wired, initial
  migration applied; `scripts\setup_db.ps1` (idempotent) + `scripts\dev.ps1`;
  venv at `backend\.venv` (D:).
- **Decided:**
  - **PostGIS skipped for MVP** (D3 fallback exercised): portable PostGIS on
    Windows is not feasible → lat/lng columns + haversine + JSONB cell boundaries.
    Revisit with real PostGIS deployment post-MVP.
  - **Port 5432 is blocked by security software on this machine** (bind →
    WinError 10013, verified even outside sandbox; 5433 works) → Postgres runs on
    **5433**; all connection strings updated.
  - Sandbox on this machine blocks TCP listeners/connections → DB/dev servers
    must run unsandboxed; `setup_db.ps1`/`dev.ps1` are the normal entry points.
  - The machine's global Python lives at `D:\dev\New folder` (already on D:).
- **Not working / known issues:** 5432 permanently unusable on this box — keep
  everything on 5433.
- **Next:** M1 — auth.
- **Commit:** see git log

## Iteration 0 — 2026-10-05 — PRD review, project rules, plan

- **Milestone:** pre-M0
- **Done:** Read PRD end-to-end; resolved its open ambiguities as decisions
  D1–D10 in `PLAN.md`; created `RULES.md` (D-drive-only rule, context.md
  protocol, engineering rules), `AGENTS.md`, `PLAN.md`, `context.md`,
  `.gitignore`; initialized git repo on D: and committed baseline.
- **Decided:** See `PLAN.md` §1. Highlights:
  - D1: client is a **PWA first** (React + Vite + MapLibre GL JS), not Expo —
    fastest loop, and avoids Android SDK/Gradle defaults on C: (Rule 1).
    Expo client possible post-MVP against the same API.
  - D2: FastAPI + local JWT auth (no external provider).
  - D3: PostgreSQL portable install, cluster at `data\pg` on D:; no Docker
    (its WSL2 disk defaults to C:). PostGIS vs haversine fallback decided in M0.
  - D4: H3 resolution 8; Lucknow ≈ 850 cells.
  - D5: foreground-only location tracking.
  - D7: ~50 hand-curated Lucknow seed places.
- **Not working / known issues:** PostgreSQL not installed on machine yet (M0
  task). Node 24 / Python 3.13 / Git confirmed present.
- **Next:** M0 — Foundation.
- **Commit:** (see git log — baseline docs commit)

---

## Rule 1 exceptions (anything written outside `D:\world game\`)

- (none yet)

## Open Questions

- (none blocking)
