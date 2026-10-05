# PLAN.md — Project Plan: Real-World Exploration Game

**Owner:** Harsh · **Plan version:** 1.0 · **Date:** 2026-10-05
**Companions:** `RULES.md` (binding rules) · `context.md` (current state & iteration log) · `real_world_exploration_game_PRD.md` (product spec)

---

## 0. Goal

Build the MVP defined in PRD §22 and prove PRD §46's single question:

> Is physically unlocking the real world fun enough that people want to keep exploring?

Core loop: **MAP → FOG → MOVE → VERIFY → UNLOCK → XP → DISCOVER → RECOMMEND → PROGRESS**

Everything in this plan serves that loop. Anything not in it is out of scope (PRD §21).

---

## 1. Decision Log (append-only)

The PRD's open ambiguities are resolved here. Agents implement these decisions;
new decisions get appended with the next number.

- **D1 — Client is a PWA first, not Expo.** React + Vite + MapLibre GL JS + Tailwind,
  installable to the phone home screen. *Deviation from PRD §27 (recommended Expo).*
  Rationale: fastest iteration on the core question; browser Geolocation works on
  Android/iOS over HTTPS; avoids the entire Android SDK/Gradle/Android Studio
  toolchain, which installs to C:\ by default and would violate Rule 1. An Expo
  client can be added later (v1.1) against the same API — the backend does not care.
- **D2 — Backend: FastAPI + SQLAlchemy 2 + Alembic + Pydantic v2.** Python 3.13
  (installed). JWT auth implemented locally (bcrypt hashes, short-lived tokens) —
  *deviation from PRD §27 "managed auth provider"*: zero external dependency,
  fully local, free, and trivial to swap later.
- **D3 — Database: PostgreSQL 16 + PostGIS, portable install on D:.** No Docker
  (Rule 1). M0 installs portable PostgreSQL binaries under `backend\tools\pg\`
  (or equivalent) with cluster data at `data\pg`. PostGIS extension enabled via
  portable binaries that bundle it; if PostGIS proves troublesome on Windows
  portable, fallback: store lat/lng columns + lat/lng btree/gist indexes and do
  radius math with haversine in SQL — PostGIS upgrade deferred. Decide finally in M0
  and record in context.md.
- **D4 — H3 resolution 8** (~460 m edge, ~0.74 km² per cell). Lucknow ≈ 850 cells —
  100% completion is hard but conceivable; 25% is a real grind but achievable.
  City/country/world percentages = unlocked cells / cells whose centroid falls
  inside the city boundary polygon. Lucknow boundary hardcoded for MVP.
- **D5 — Foreground-only tracking.** Location is collected only while the app is
  open (browser `watchPosition`). No background geolocation in MVP. Documented
  platform limitation, matches PRD §8's "don't over-engineer" stance.
- **D6 — Fog rendering strategy:** the dark basemap **is** the fog. Explored cells
  are drawn as a bright hex fill layer on top (GeoJSON from the server for the
  current viewport). No world-scale per-cell polygons; performance is bounded by
  viewport, not planet.
- **D7 — Seed data: ~50 hand-curated Lucknow places** (monuments, parks,
  viewpoints, food streets, cultural spots) authored by us for MVP. OSM import is
  a post-MVP option (brings ODbL attribution obligations). Solves PRD Risk 1
  (empty map) for the launch city.
- **D8 — Map tiles: zero-cost default.** CARTO dark basemap (free raster tiles) for
  the fog look. MapTiler free tier is an upgrade path if a key is added to `.env`.
- **D9 — Progression numbers** (owned by backend `config.py`, PRD §13 values plus
  one addition): unlock cell +10, create discovery +25, recommend +20 (once per
  user per discovery), first verified visit of a discovery +15, city milestone 25%
  +200. Level thresholds: cumulative XP for level *n* = `50·n·(n−1)` → L2@100,
  L3@300, L4@600, L5@1000 … All values configurable, not hardcoded in logic.
- **D10 — Storage: local disk.** Photos/avatars go to `data\uploads`, served by
  FastAPI StaticFiles. Object storage is a post-MVP swap behind the same URL shape.

---

## 2. Architecture

```
[Phone / desktop browser — PWA]         [FastAPI backend]              [PostgreSQL + PostGIS]
 web/  React + Vite + MapLibre GL JS ←→ REST + JWT, h3-py          ←→  data\pg  (D: only)
        dark basemap = fog                   server-side verification          data\uploads
        explored hexes = fill layer          XP / achievements / stats         (photos, D: only)
```

- **The client renders; the server decides.** The client sends raw fixes
  `{lat, lng, accuracy_m, recorded_at}`; the backend validates, converts to H3,
  unlocks, awards XP, and returns state.
- One backend serves both the JSON API and the built PWA for local "production"
  runs (LAN testing on a real phone).

## 3. Repository Layout

```
D:\world game\
├── RULES.md  AGENTS.md  PLAN.md  context.md  .gitignore  .env.example
├── real_world_exploration_game_PRD.md
├── backend\
│   ├── app\
│   │   ├── main.py  config.py  db.py
│   │   ├── models\        # SQLAlchemy models
│   │   ├── schemas\       # Pydantic request/response
│   │   ├── api\           # routers: auth, me, map, exploration, discoveries, reports, admin
│   │   ├── services\      # verification.py, exploration.py, gamification.py, achievements.py
│   │   └── seed\          # lucknow_places.json + loader
│   ├── tests\             # pytest
│   ├── alembic\           # migrations
│   ├── pyproject.toml
│   └── .venv\             # gitignored, on D:
├── web\
│   ├── src\
│   │   ├── app\           # screens: Map, DiscoverySheet, Profile, Onboarding
│   │   ├── map\           # MapLibre setup, fog layer, hex source
│   │   ├── api\           # typed fetch client, auth token handling
│   │   ├── components\    # XP burst, stats bar, cards
│   │   ├── theme\         # design tokens
│   │   └── hooks\         # useGeolocation, useExploration
│   ├── index.html  vite.config.ts  .npmrc  package.json
│   └── node_modules\      # gitignored, on D:
├── scripts\               # dev.ps1, setup_db.ps1, seed_db.py
└── data\                  # gitignored entirely: pg\, uploads\, .pip-cache\
```

## 4. Database Schema (v1)

```
users            id, username UNIQUE, email UNIQUE, password_hash, avatar_url,
                 level, xp, privacy JSONB, is_admin BOOL, created_at
cells            h3_index BIGINT PK, resolution SMALLINT,
                 centroid GEOGRAPHY(Point), boundary GEOGRAPHY(Polygon)
user_cells       user_id FK, h3_index FK, first_explored_at, verification JSONB,
                 UNIQUE(user_id, h3_index)
discoveries      id, name, description, category, location GEOGRAPHY(Point),
                 h3_index, created_by FK NULL, status ENUM(active,hidden,removed),
                 source ENUM(seed,user), created_at
visits           id, user_id FK, discovery_id FK, visited_at, lat, lng, accuracy_m,
                 verification ENUM(verified,rejected), UNIQUE(user_id, discovery_id)
recommendations  id, user_id FK, discovery_id FK, created_at,
                 status ENUM(active,removed), UNIQUE(user_id, discovery_id)
photos           id, user_id FK, discovery_id FK, url, moderation ENUM(pending,approved,rejected),
                 created_at
achievements     id, code UNIQUE, name, description, criteria JSONB
user_achievements user_id FK, achievement_id FK, earned_at, UNIQUE(user_id, achievement_id)
xp_events        id, user_id FK, kind, amount, ref_id, created_at   -- append-only audit
reports          id, reporter_id FK, target_type ENUM(discovery,photo,recommendation,user),
                 target_id, reason, details, status ENUM(open,resolved), created_at
```

`users.xp`/`level` are maintained caches reconcilable against `xp_events`.
Challenges are deferred (PRD §15 allows this).

## 5. API Contract v1

All under `/api`, JSON, bearer token auth unless noted. Errors: FastAPI
`{detail}` with proper 401/403/404/422.

```
POST /auth/register        {username, email, password} → {token, user}
POST /auth/login           {username_or_email, password} → {token, user}

GET  /me                   → user profile
GET  /me/stats             → {cells, cities, discoveries, recommendations, pct_by_city, world_pct}
GET  /me/achievements      → [achievements + earned_at]

GET  /map/explored?bbox=   → GeoJSON FeatureCollection of unlocked hexes (bbox clamped)
GET  /map/summary          → {lucknow: {explored, total, pct}, world: {...}}

POST /exploration/ping     {fixes: [{lat, lng, accuracy_m, recorded_at}] (≤20)}
                           → {unlocked: [h3_index], xp_awarded, xp, level, new_achievements}

GET  /discoveries/nearby?lat&lng&radius_m=2000   → [discovery summaries]
GET  /discoveries/{id}     → detail incl. visit/recommend counts, score, photos
POST /discoveries          {name, category, description?, lat, lng} (requires accepted fix nearby ≤300 m)
POST /discoveries/{id}/visit       (requires accepted fix within 150 m)
POST /discoveries/{id}/recommend   (requires verified visit first)
POST /discoveries/{id}/photos      multipart

POST /reports              {target_type, target_id, reason, details?}

GET  /admin/reports                      (is_admin)
POST /admin/discoveries/{id}/status      (is_admin)
POST /admin/users/{id}/ban               (is_admin)
```

## 6. Exploration & Verification Contract (concrete)

Client behavior: while the map is open, `watchPosition` collects fixes; batches of
≤20 are POSTed to `/exploration/ping` at most once per 5 s.

Server, per fix, in order:

1. Auth required.
2. Schema: `lat ∈ [-90,90]`, `lng ∈ [-180,180]`, `accuracy_m > 0`, ISO timestamp.
3. **Accuracy:** `accuracy_m ≤ 50`, else `rejected(accuracy)`.
4. **Freshness:** `|now − recorded_at| ≤ 5 min`, else `rejected(stale)`.
5. **Plausibility:** implied speed from the user's last accepted fix ≤ 160 km/h,
   else `rejected(speed)` + anti-cheat flag in `xp_events`.
6. **Unlock:** `h3.latlng_to_cell(lat, lng, 8)`; if the cell is new for the user →
   insert `user_cells`, +10 XP, run achievement checks, return unlocked cells.
7. Dwell requirement: **none** for MVP. Mock-location detection: not available in
   browsers — recorded as a known MVP limitation (PRD §8 tolerates this).

Anti-cheat MVP = the validations above + append-only `xp_events` + ping rate limit
(≥5 s between calls). Nothing more (PRD §8).

## 7. Gamification

See D9 for values. Level curve: `xp_for_level(n) = 50·n·(n−1)` cumulative.
Achievements at launch (PRD §14): `first_steps`, `explorer` (10 cells),
`city_walker` (25% Lucknow), `local` (50% Lucknow), `gem_hunter` (10 recommended
discoveries visited), `completionist` (100% Lucknow). Criteria stored as JSONB,
evaluated by `services/achievements.py` after every XP event.

## 8. Visual Direction

The product must feel like uncovering the real world (PRD §25).

- **Base:** near-black navy (`#0B0E13` family), dark desaturated basemap = fog.
- **Fog reveal:** explored hexes fill with a single luminous accent —
  electric lime `#C8F135` (chosen; revisit only in M2 with the map on screen),
  ~55% opacity, soft edge glow on unlock.
- **Type:** Space Grotesk (display/numbers) + Inter (UI). Big stat numbers,
  uppercase letter-spaced labels.
- **Motion:** unlock = hex fill wipe + XP count-up, ≤300 ms, sparing. Achievement
  toast slides once. No confetti spam.
- **Surfaces:** glassy dark cards, rounded-xl, hairline borders; discovery detail
  as a bottom sheet; stats bar docked over the map.
- **Onboarding:** ≤3 screens (world is dark → walk to reveal → first objective).

## 9. Milestones

Each milestone = one or more iterations (Rule 2). Every iteration ends with the
repo runnable, `context.md` updated, and a commit.

- **M0 — Foundation.** Folder skeleton; portable PostgreSQL installed with cluster
  at `data\pg` + PostGIS decision recorded (D3); FastAPI app with `/health`;
  pytest + Alembic wired; `.env`/`.env.example`; `scripts\dev.ps1` runs API.
  *AC: `/health` returns ok; `pytest` green; zero project files on C:.*
- **M1 — Auth & users.** Register/login/JWT, `/me`. *AC: register → login → `/me`
  via curl; PRD §41 auth/permission tests pass.*
- **M2 — Map & fog (web).** Vite + React + MapLibre, dark style, geolocation
  button, `/map/explored` hex overlay, seed script unlocks a few cells for the dev
  user to preview. *AC: on a phone over LAN the map shows fog, unlocked hexes, and
  your position.*
- **M3 — Exploration engine.** `/exploration/ping` + verification + unlock + XP +
  level + stats; live: walk → hexes light up. *Tests: duplicate unlock grants no
  XP; accuracy/stale/speed/coordinate rejections; unauthorized pings.*
- **M4 — Discoveries.** Schema + ~50 Lucknow seeds; nearby list, detail sheet,
  verified visit; user-created discoveries with PRD §31 rules (presence, rate
  limit). *Tests: creation rules, duplicate visits, distance enforcement.*
- **M5 — Recommendations.** Worth-visiting action (gated on verified visit),
  counts, score = recommendations / unique verified visitors. *Tests: one per
  user per place, gating, score math.*
- **M6 — Photos & achievements.** Upload to `data\uploads` + gallery on discovery
  detail; 6 achievements with award checks. *Tests: upload auth, achievement triggers.*
- **M7 — Reports & admin.** Report endpoints; minimal admin endpoints (curl/scripts,
  no dashboard UI). *Tests: report submission, admin-only access.*
- **M8 — Polish & Definition of Done.** Onboarding, empty/error/loading states,
  XP animations, PWA manifest + icons, LAN device pass, then walk PRD §40's
  16-step journey end-to-end on a real phone and record it in `context.md`.

## 10. Testing Requirements (PRD §41 mapped)

`backend\tests\` pytest suite must cover: auth (register/login/bad credentials),
exploration verification (accuracy, stale, speed, invalid coords), duplicate
exploration grants no XP, XP totals & level curve, discovery creation rules,
recommendation gating/uniqueness, permission errors (401/403), report submission.
Frontend has no geo math by design (server decides) — vitest only if that changes.

## 11. Non-Goals for MVP (PRD §21, restated)

No social network, messaging, feeds, leaderboards, AR, realtime multiplayer,
commerce/booking/ads, advanced CV, travel planning, crypto, monetization.
No challenges (PRD allows deferring). No background location tracking (D5).

## 12. Definition of Done

PRD §40's 16-step journey, executed on a real phone, with each step verified and
recorded in `context.md`. That is the MVP bar — nothing less, nothing more.
