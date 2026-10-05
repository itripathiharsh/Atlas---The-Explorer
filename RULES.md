# RULES.md — Binding Project Rules

These rules apply to every human or AI agent working in this repository.
Rules cannot be waived silently. If a rule cannot be followed, the exception and
reason must be recorded in `context.md` → **Rule 1 exceptions**.

---

## Rule 1 — All project data stays on D:

Every file created because of this project must live inside `D:\world game\`.
Nothing in `C:\` — not caches, not virtualenvs, not database files, not uploads, not build output.

| Artifact              | Location                        |
|-----------------------|---------------------------------|
| Code, docs, configs   | repo root and subfolders        |
| Python virtualenv     | `backend\.venv`                 |
| node_modules          | `web\node_modules`              |
| npm cache             | `web\.npm-cache` (via `web\.npmrc`) |
| pip cache             | `data\.pip-cache` (`PIP_CACHE_DIR` set by dev scripts) |
| PostgreSQL data dir   | `data\pg`                       |
| Photo/avatar uploads  | `data\uploads`                  |

Notes:

- Machine-level tool installations (Node, Python, Git themselves) are not project
  data. But any file they generate *for this project* (package caches, venvs,
  database clusters, build artifacts) must land inside the repo folder.
- Docker Desktop is **not allowed** for this project unless its disk image is
  relocated to D: (the default WSL2 disk lives on C:). Prefer a portable
  PostgreSQL with `initdb -D "D:\world game\data\pg"`.
- If a tool unavoidably writes outside the repo (e.g. OS temp dir during a single
  build), record it in `context.md` → **Rule 1 exceptions**. No silent violations.

---

## Rule 2 — `context.md` is the project's memory

The point: no agent ever drifts from context. Working without it is forbidden.

- **Session start (mandatory):** read `RULES.md` → `PLAN.md` → `context.md`
  before touching anything.
- **Session end (mandatory):** append an iteration entry and update the
  **Current State** section at the top of `context.md`:

  ```markdown
  ## Iteration N — YYYY-MM-DD — <one-line goal>
  - **Milestone:** M0–M8 (or "pre-M0")
  - **Done:** what was actually built/changed
  - **Decided:** any decision made or deviation from PLAN.md
  - **Not working / known issues:** honest list; write "none" only if truly none
  - **Next:** the next concrete step
  - **Commit:** <sha> or "none"
  ```

- **Chat is not project memory.** Feedback, corrections, or new direction the
  owner gives in conversation must be written into `context.md` (iteration entry
  or decisions) in the same session. If it isn't in the files, it didn't happen.
- Report what *is*, not what was intended. Never mark work done that was not
  verified running.
- Iteration entries are append-only. The **Current State** section is updated in place.

---

## Rule 3 — Engineering practice

1. **Small iterations.** One milestone slice at a time (see `PLAN.md` §9). The
   repo must be runnable at the end of every iteration.
2. **The server is the source of truth.** All geography — H3 conversion, unlock
   decisions, distances, XP, stats — is computed and validated in the backend.
   The client only renders and reports raw GPS fixes. Never trust client-side
   location claims.
3. **Tests before commit.** Backend: `pytest`, covering the PRD §41 test list.
   Do not commit red tests.
4. **Secrets stay out of git.** `.env` is gitignored; `.env.example` lists every
   variable with safe placeholder values.
5. **Commit at least once per iteration.** Conventional prefix + milestone +
   iteration, e.g. `feat(M3): exploration ping verification (iter-4)`.
   `main` is always runnable; no force-push.
6. **Destructive actions need confirmation.** Never delete `data\`, drop tables,
   or reset the database without asking the owner first.
7. **UI bar.** Mobile-first, map-first, dark and immersive, per `PLAN.md` §8.
   No dashboard aesthetics. No Google-Maps clone. This product must feel like a game.
