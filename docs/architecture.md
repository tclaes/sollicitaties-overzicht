## Architecture

- Smart / dumb component split; KISS and YAGNI (existing convention, keep it).
- Routes live in `app/routes/` (file-based). `app/routeTree.gen.ts` is **generated** by the TanStack Router Vite plugin
  on `dev`/`build` — never edit it by hand.
- Path aliases: `~/*` → `app/*`, `~/elements/*` → `app/components/elements/*`.
- Domain logic is `app/lib/`: Zod schemas (`schemas.ts`), Firestore <-> domain mappers (`firestoreMappers.ts`), vacancy
  logic (`vacancies.ts`). Tests are co-located as `*.test.ts(x)`.
- Firestore model: `vacatures` collection with fields `titel`, `bedrijf`, `locatie`, `regio`, `url`, `bron`, `functie`,
  `tags`, `status`, plus `match`. Status values: `nieuw`, `bekeken`, `gesolliciteerd`, `niet-interessant`. Archived
  vacancies use `isArchived: true` + `status: "niet-interessant"` (+ `archiveReason`). `regio` values: `limburg`,
  `antwerpen`, `vlaanderen`, `brussel`, `remote`, `andere`. `functie`: `frontend`, `fullstack`.
- Vacancy list (`/vacatures`): infinite scroll via `useInfiniteList` (`app/lib/useInfiniteList.ts`) — renders `PAGE_SIZE`
  chunks, loads the next on an `IntersectionObserver` sentinel and one chunk ahead when idle. Filtering and sorting stay
  client-side over the in-memory loader data (route `staleTime` keeps it cached; `router.invalidate()` refreshes).
- Archived vacancies are **not** loaded by default: `getActiveVacancies()` (`status not-in` archive statuses) feeds the
  list; `getArchivedVacancies()` (`isArchived == true`) is only fetched when `needsArchive(search)` (archive status
  filter or "Inclusief gearchiveerd"). The stats bar uses server-side counts (`getVacancyCounts()`), and
  `getVacancy(id)` reads a single document. Vacancies created by the sync have no `isArchived` field, so never query
  on `isArchived != true`.
