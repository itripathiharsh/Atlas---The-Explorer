# ATLAS — Real-World Exploration Game

> The world starts unexplored. Walk to reveal it.

A fog-of-war game built on the real world: the map starts dark, you physically
move to unlock hexagonal cells, discover curated places, and mark the ones
worth visiting. Built from `real_world_exploration_game_PRD.md` — plan in
`PLAN.md`, rules in `RULES.md`, session-by-session state in `context.md`.

**Stack:** React + Vite + Tailwind v4 + MapLibre GL JS (PWA) · FastAPI ·
PostgreSQL 16 · H3 res-8 cells.

---

## Run it

```powershell
# 1. one-time: database up + migrations
powershell -File scripts\setup_db.ps1

# 2. seed Lucknow (594 cells, 44 curated places, achievements)
backend\.venv\Scripts\python.exe scripts\seed_db.py

# 3. backend :8014 + frontend :5173 (separate windows)
powershell -File scripts\dev.ps1
```

Open **http://localhost:5173** — plain HTTP, no certificate warnings
(localhost is a trusted context, so geolocation just works). Register, finish
onboarding, and walk.

**On a phone:** run `npm run dev:host` in `web\` instead (HTTPS via self-signed
cert, required because a LAN IP is not a trusted origin). Then open
`https://<your-lan-ip>:5173` on the phone, accept the cert warning
(Chrome: Advanced → Proceed), and allow location.

## Layout

```
backend\    FastAPI app (app\), tests (tests\), migrations (alembic\), venv (on D:)
web\        React PWA (src\), screenshot QA (scripts\shot.mjs)
scripts\    setup_db.ps1, dev.ps1, seed_db.py
tools\pg\   portable PostgreSQL 16.9 (gitignored, on D:)
data\       pg cluster, uploads, caches (gitignored, on D:)
```

## The game rules (server is the source of truth)

- GPS fixes are batched to `POST /api/exploration/ping` every 4 s.
- A fix is accepted when: accuracy ≤ 50 m, ≤ 5 min old, and implied speed from
  the last accepted fix ≤ 160 km/h (checks ≥ 1 s apart).
- Accepted fix → H3 res-8 cell (~460 m). New cell = +10 XP.
- Discoveries: visit requires being within 150 m (+15 XP, once); recommend
  requires a verified visit (+20 XP, once per place); creating (+25 XP, ≤ 5/day).
- Levels: cumulative `50·n·(n−1)` — L2 @ 100 XP, L3 @ 300, L4 @ 600 …

## Testing

```powershell
cd backend
.venv\Scripts\python.exe -m pytest    # 34 tests: auth, verification, XP, discoveries, reports, admin
```

## Visual QA

```powershell
# backend + vite dev running, then:
cd web
node scripts\shot.mjs    # drives the app in headless Edge with simulated GPS walk
# screenshots → data\shots\
```

## Notes for this machine

- **Port 5432 is blocked by security software** → PostgreSQL runs on **5433**.
- **Desktop demo mode** (`GPS_DEV_MODE=true` in `.env`): relaxes the 50 m GPS
  gate to 5 km so the full loop is playable from a laptop. Tests always run in
  strict mode regardless. Leave unset for real exploration.
- Everything (venv, node_modules, DB cluster, uploads, caches) lives inside this
  folder on D: — see `RULES.md` Rule 1.
- Map basemap: OpenFreeMap dark (free, keyless). Set `VITE_MAPTILER_KEY` for
  MapTiler instead.
