# SollicitatiesApp

Personal job-application tracker: React 19 + Vite + TanStack Router, Firebase (Auth + Firestore). The app UI, comments, commit messages, and data are all **in Dutch** — write new copy/messages in Dutch.

See `CLAUDE.md` at the repo root for the full operational playbook (git workflow, Firestore-sync, daily vacancy scan). This file only adds facts that change how you work.

## Architecture

- Smart / dumb component split; KISS and YAGNI (existing convention, keep it).
- Routes live in `app/routes/` (file-based). `app/routeTree.gen.ts` is **generated** by the TanStack Router Vite plugin on `dev`/`build` — never edit it by hand.
- Path aliases: `~/*` → `app/*`, `~/elements/*` → `app/components/elements/*`.
- Domain logic is `app/lib/`: Zod schemas (`schemas.ts`), Firestore <-> domain mappers (`firestoreMappers.ts`), vacancy logic (`vacancies.ts`). Tests are co-located as `*.test.ts(x)`.
- Firestore model: `vacatures` collection with fields `titel`, `bedrijf`, `locatie`, `regio`, `url`, `bron`, `functie`, `tags`, `status`, plus `match`. Status values: `nieuw`, `bekeken`, `gesolliciteerd`, `niet-interessant`. Archived vacancies use `isArchived: true` + `status: "niet-interessant"` (+ `archiveReason`). `regio` values: `limburg`, `antwerpen`, `vlaanderen`, `brussel`, `remote`, `andere`. `functie`: `frontend`, `fullstack`.

## Commands

- Toolchain is **Vite+** (`vp`): dev, lint, type-check, test, build. The `vp` binary ships in the repo via the `vite-plus` package (`node_modules/.bin/vp`); a global `vp` is optional.
- `npm test` — Vitest, ran once via `vp test` (jsdom). Watch-mode: `npm exec vp test watch` — only needed while iterating.
- `npm run test:e2e` — Playwright against the **Firebase emulators** (`firebase emulators:exec`), seeded with fixtures from `e2e/seed.ts`; never touches production Firestore. Requires local Java (Firestore emulator): `brew install openjdk@21`, add `/opt/homebrew/opt/openjdk@21/bin` to PATH.
- `npm run lint:css` — stylelint on `app/**/*.css`.
- `npm run lint` — Oxlint (`vp lint .`). Config lives in the `lint` block of `vite.config.ts` (ignorePatterns, rules, typeAware/typeCheck).
- `npm run lint:sheriff` — **Sheriff module boundaries**, standalone CLI (`sheriff verify`, from `@softarc/sheriff-core` — no ESLint). All boundary config is `sheriff.config.ts`. Tags: `routes`=`type:app` (composition root), features (`login`/`vacancies`/`applications`)=`type:feature`, `elements`=`type:ui`, `layout`=`type:layout`, `lib`=`type:lib`. Rules: features/layout/ui/lib may never import `routes`; features may not import each other; `elements` and `lib` stay UI/domain-pure.
- `npm run build` — Rolldown build via `vp build`. Needs `VITE_FIREBASE_*` env vars (buildtime config, in `.env` / CI secrets); without them the app points at an empty Firebase project. `VITE_USE_FIREBASE_EMULATOR=true` switches app auth/data to the emulators.
- `npm exec vp check` — lint + tsgo type-check in one go (format step is disabled via `check.fmt: false` in `vite.config.ts`). This replaces the old `npx tsc --noEmit` check.

CI (`ci.yml`) runs on every PR to `main`: `vp check` -> `npm run lint:sheriff` -> `npm run lint:css` -> `vp test` -> `vp build` (order as written in the workflow). `deploy.yml` deploys hosting on push to `main`. Never merge directly to `main` — always a branch + PR.

## Vacature data / Firestore-sync

- Single source of truth: `data/firestore-sync-input.json`. Anything touching vacancy content or counts means updating this file.
- The sync runs in **GitHub Actions**, not locally: `sync-firestore.yml` triggers on pushes to `main` touching that file; `npm run trigger:sync` starts it manually (uses `gh`, needs `gh auth status`).
- A PR that changes **only** `data/firestore-sync-input.json` is **auto-merged** by `.github/workflows/auto-merge-vacature-sync.yml` (then syncs). Do not manually merge/edit such PRs; just make the change and open the PR. Other PRs wait for manual review.
- Required shape: a JSON array; every entry that is not `verlopen: true` / `nietInteressant: true` must have string `titel`, `bedrijf`, `url`. This is the workflow's merge gate — validate with `node -e ... JSON.parse` before pushing.