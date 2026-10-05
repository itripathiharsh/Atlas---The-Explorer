# context.md — Project Memory

> **AGENTS: read `RULES.md`, `PLAN.md`, and this file at session start.
> Update this file (iteration entry + Current State) at session end. Do not work from memory alone.**

---

## Current State (updated: Iteration 0)

- **What works:** nothing yet — planning phase complete.
- **Code:** none written.
- **How to run:** not available yet. M0 will add `scripts\dev.ps1`.
- **Next milestone:** M0 — Foundation (skeleton, portable PostgreSQL at `data\pg`,
  FastAPI `/health`, pytest wired, first commit of code).

---

## Iteration Log

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
