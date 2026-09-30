## Git workflow

- Create a new branch for every feature (e.g. `feature/sort-by-match`, `fix/login-bug`)
- Commit and push the changes to that branch
- Open a PR to `main` via `gh pr create`
- Never merge directly to `main`

## Auto merge

A PR that changes **only** `data/firestore-sync-input.json` is **auto-merged** by
`.github/workflows/auto-merge-vacature-sync.yml`, provided the file contains valid JSON (every non-expired vacancy must
have `titel`, `bedrijf` and `url`). Do not manually merge/edit such PRs; just make the change and open the PR.

After the merge, that workflow explicitly starts `sync-firestore.yml` on `main` — a merge via `GITHUB_TOKEN`
does not fire the push trigger.

If the PR touches even one other file, nothing happens and the PR waits for a manual review.

The daily routine is therefore: generate JSON → branch + PR to `main` → auto-merge
→ the Action syncs. (Running `npm run trigger:sync` directly is still possible, but then you sync
the version that is already on `main`.)
