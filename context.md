# context.md — Project Memory

> **AGENTS: read `RULES.md`, `PLAN.md`, and this file at session start.
> Update this file (iteration entry + Current State) at session end. Do not work from memory alone.**

---

## Current State (updated: Iteration 2)

- **What works:** full auth (register/login/JWT) verified by tests; PostgreSQL 16.9
  portable server running from `tools\pg` with cluster at `data\pg` on D:, port
  **5433**; Alembic initial migration applied; `pytest`: 8 passed.
- **Code:** backend (`backend\app`) — health, auth, /me, models for all planned
  tables. Frontend: not started yet (M2 next).
- **How to run:** `powershell -File scripts\setup_db.ps1` (starts DB + migrations),
  then `powershell -File scripts\dev.ps1` (backend :8000, frontend :5173 — frontend
  from M2 onward).
- **Next milestone:** M2 — web app (Vite + Tailwind + MapLibre dark map + fog).

---

## Iteration Log

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
