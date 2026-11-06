## Firestore sync

The vacancy sync runs in GitHub Actions, no longer locally.

- Single source of truth: `data/firestore-sync-input.json`. Anything touching vacancy content or counts means updating
  this file.
- Workflow: `.github/workflows/sync-firestore.yml`
- Trigger: every push to `main` that changes `data/firestore-sync-input.json`, plus manually
  via *Run workflow* (with an option to actually clean up duplicates) or via the CLI:

  ```
  npm run trigger:sync              # start the workflow and follow the run
  npm run trigger:sync -- --dedupe  # same, but also actually cleans up duplicates
  npm run trigger:sync -- --force   # sync even if the input has not changed
  ```

  `trigger:sync` uses `gh workflow run sync-firestore.yml --ref main`, so the
  cowork app can start the sync entirely on GitHub without pushing to `main` first.
  Requires a logged-in GitHub CLI (`gh auth status`) with `repo` scope.

  The workflow always syncs the version of `data/firestore-sync-input.json` that is on
  `main`. Therefore `trigger:sync` exits with code 0 without starting the workflow if
  that file does not differ from `origin/main` (committed or not) — there is nothing
  to sync then. With `--force` you skip that check.
- Auth: repo secret `FIREBASE_SERVICE_ACCOUNT` — the full contents of the
  service-account JSON. The workflow writes it to a temporary file and removes
  it afterwards.
- Optional field `gecontroleerdOp` (`YYYY-MM-DD`): the day the vacancy page was last seen live. It is synced to the
  Firestore document (the app ignores it) and checked by the merge gate, see below.
- Merge gate: `scripts/check-sync-input.mjs` (`npm run check:sync-input`) runs in `auto-merge-vacature-sync.yml` and
  locally. It fails on duplicate vacancies (same normalized url / document id, or same title + company + location),
  on an active item that matches an archived (`nietInteressant`) one, and on active items whose `gecontroleerdOp` is
  missing (from 2026-11-20) or older than 14 days. Same-company-and-title on another location is only a warning.
  Identity logic (`normalizeUrl`, `documentId`, `sameJobKey`) lives in `scripts/vacancy-keys.mjs`, shared with the
  sync and dedupe scripts.
- After each sync the `Dedupe-check` step runs `dedupe:firestore -- --check` and fails the job if duplicates remain in
  Firestore (nothing is written; `Run workflow` with `dedupe_fix` or `npm run trigger:sync -- --dedupe` cleans up).
- Required shape: a JSON array; every entry that is not `verlopen: true` / `nietInteressant: true` must have string
  `titel`, `bedrijf`, `url`. This is the workflow's merge gate — validate with `node -e ... JSON.parse` before pushing.
  See `docs/git.md` for how PRs that only touch this file are auto-merged.
