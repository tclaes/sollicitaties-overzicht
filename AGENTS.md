# SollicitatiesApp

Personal job-application tracker: React 19 + Vite + TanStack Router, Firebase (Auth + Firestore). The app UI, comments,
commit messages, and data are all **in Dutch** — write new copy/messages in Dutch.

See `CLAUDE.md` at the repo root for the full operational playbook (git workflow, Firestore-sync, daily vacancy scan).
This file only adds facts that change how you work.

## Architecture

References `docs/architecture.md` for architecture decisions

## Commands

- Toolchain is **Vite+** (`vp`): dev, lint, type-check, test, build. The `vp` binary ships in the repo via the
  `vite-plus` package (`node_modules/.bin/vp`); a global `vp` is optional.
- `npm test` — Vitest, ran once via `vp test` (jsdom). Watch-mode: `npm exec vp test watch` — only needed while
  iterating.
- `npm run test:e2e` — Playwright against the **Firebase emulators** (`firebase emulators:exec`), seeded with fixtures
  from `e2e/seed.ts`; never touches production Firestore. Requires local Java (Firestore emulator):
  `brew install openjdk@21`, add `/opt/homebrew/opt/openjdk@21/bin` to PATH.
- `npm run lint:css` — stylelint on `app/**/*.css`.
- `npm run lint` — Oxlint (`vp lint .`). Config lives in the `lint` block of `vite.config.ts` (ignorePatterns, rules,
  typeAware/typeCheck).
- `npm run lint:sheriff` — **Sheriff module boundaries**, standalone CLI (`sheriff verify`, from
  `@softarc/sheriff-core` — no ESLint). All boundary config is `sheriff.config.ts`. Tags: `routes`=`type:app`
  (composition root), features (`login`/`vacancies`/`applications`)=`type:feature`, `elements`=`type:ui`, `layout`=
  `type:layout`, `lib`=`type:lib`. Rules: features/layout/ui/lib may never import `routes`; features may not import each
  other; `elements` and `lib` stay UI/domain-pure.
- `npm run build` — Rolldown build via `vp build`. Needs `VITE_FIREBASE_*` env vars (buildtime config, in `.env` / CI
  secrets); without them the app points at an empty Firebase project. `VITE_USE_FIREBASE_EMULATOR=true` switches app
  auth/data to the emulators.
- `npm exec vp check` — lint + tsgo type-check in one go (format step is disabled via `check.fmt: false` in
  `vite.config.ts`). This replaces the old `npx tsc --noEmit` check.

CI (`ci.yml`) runs on every PR to `main`: `vp check` -> `npm run lint:sheriff` -> `npm run lint:css` -> `vp test` ->
`vp build` (order as written in the workflow). `deploy.yml` deploys hosting on push to `main`. Never merge directly to
`main` — always a branch + PR.

## Vacature data / Firestore-sync

References `docs/firestore-sync.md`
