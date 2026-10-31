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
  client-side over the in-memory loader data. The route deliberately has no `staleTime`: back-navigation shows the cached
  data and revalidates in the background, because not every mutation calls `router.invalidate()`.
- Archived vacancies are **not** loaded by default: `getActiveVacancies()` (`status not-in` archive statuses) feeds the
  list; `getArchivedVacancies()` (`isArchived == true`) is only fetched when `needsArchive(search)` (archive status
  filter or "Inclusief gearchiveerd"). The stats bar uses server-side counts (`getVacancyCounts()`), and
  `getVacancy(id)` reads a single document. Vacancies created by the sync have no `isArchived` field, so never query
  on `isArchived != true`.
- Statusfilter: via de klikbare tellers in `StatsCounter` ("Totaal" wist de statusfilter); `FilterPills` heeft geen
  status-groep meer.

## Responsive

- Breakpoints: telefoon < 640px, tablet 640–1023px, desktop ≥ 1024px (`app/lib/breakpoints.ts`; in CSS letterlijk
  herhaald, zie commentaar in `tokens.css`). CSS is mobile-first (`min-width`).
- Touch via capabilities, niet via breedte: `@media (pointer: coarse)` (44px-targets, `--touch-target`) en
  `@media (hover: none)` (geen hover-only acties).
- Tabel vs. kaarten: `useMediaQuery(DESKTOP_QUERY)` kiest één weergave (nooit beide renderen).
- Navigatie: onder 1024px is `Nav` een drawer die `AppShell` opent via de hamburgerknop in `Header`.

## Thema (licht/donker)

- Drie standen: `auto` (standaard, volgt `prefers-color-scheme`), `light` en `dark`. De keuze staat in `localStorage`
  (`vacature-theme`); de keuzeknop (`ThemeSelect`) zit onderaan `Nav` (zijbalk op desktop, drawer op kleinere schermen),
  niet in de header.
- Logica: `app/lib/theme.ts` (puur, getest) en `app/lib/useTheme.ts` (hook, aangeroepen in `AppShell`). Het *effectieve*
  thema (`light` of `dark`) staat als `data-theme` op `<html>`; `auto` wordt dus vóór het zetten opgelost.
- Geen flits: een inline script in `index.html` zet `data-theme` (en `theme-color`) vóór de eerste paint. Het dupliceert
  de leeslogica van `theme.ts`; `app/lib/themeInlineScript.test.ts` voert het echte script uit en vergelijkt met `theme.ts`.
- Kleuren: enkel via tokens. `tokens.css` heeft de lichte waarden in `:root` en de donkere onder `[data-theme="dark"]`.
  **Een nieuw `--color-*` token krijgt altijd in beide blokken een waarde** (`app/styles/tokens.test.ts` faalt anders) en
  tekst/achtergrond-paren moeten ≥ 4,5:1 halen (rand/focus ≥ 3:1). Voeg een nieuw paar toe aan `textPairs` in die test.
- `--color-accent` is voorgrond/rand/outline; voor een knopvulling met `--color-text-inverse` erop gebruik je
  `--color-accent-solid` (en `-hover`), die in beide thema's gelijk zijn.
