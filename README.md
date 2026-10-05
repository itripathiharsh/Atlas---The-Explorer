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

# 3. backend :8000 + frontend :5173 (separate windows)
powershell -File scripts\dev.ps1
```

Open **https://localhost:5173** (self-signed cert — accept it; HTTPS is required
for geolocation). Register, finish onboarding, and walk.

**On a phone:** both dev servers listen on the LAN. Open
`https://<your-lan-ip>:5173` on the phone (same Wi-Fi), accept the cert warning,
allow location. Frontend dev mode enables HTTPS automatically for this.

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
- Everything (venv, node_modules, DB cluster, uploads, caches) lives inside this
  folder on D: — see `RULES.md` Rule 1.
- Map basemap: OpenFreeMap dark (free, keyless). Set `VITE_MAPTILER_KEY` for
  MapTiler instead.
