# context.md — Project Memory

> **AGENTS: read `RULES.md`, `PLAN.md`, and this file at session start.
> Update this file (iteration entry + Current State) at session end. Do not work from memory alone.**

---

## Current State (updated: Iteration 5)

- **What works:** the full MVP loop, verified visually end-to-end with simulated
  GPS in headless Edge: register → onboarding → dark map → live GPS tracking →
  server-verified unlocks (+XP animations) → discovery pins → detail sheet →
  stats/profile with achievements. Backend: 34/34 tests green. Frontend builds
  clean (`npm run build`).
- **Code:** `backend\` (FastAPI, all M0–M7 features), `web\` (React PWA, all
  screens), `scripts\` (setup/dev/seed), seed data: 594 Lucknow cells + 44 places.
- **How to run:** `powershell -File scripts\setup_db.ps1` → seed via
  `backend\.venv\Scripts\python.exe scripts\seed_db.py` →
  `powershell -File scripts\dev.ps1`. App at https://localhost:5173 (LAN: same
  URL with machine IP; HTTPS is auto-enabled in dev for phone geolocation).
- **Not yet done (needs a human outside):** PRD §40's physical walk (steps 5–8)
  with a real phone; PWA icon PNGs (SVG only for now); code-splitting the 1 MB
  maplibre bundle.
- **Next milestone:** M8 leftovers above, or owner feedback from first real play.

---

## Iteration Log

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
