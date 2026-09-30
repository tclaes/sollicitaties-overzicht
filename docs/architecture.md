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
