# Proposal

## Why

De app is ontworpen voor desktop: een vaste zijbalk van 200px, een vacaturetabel met vaste kolombreedtes (~800px+ nodig), een statusstrip met 6 items naast elkaar en `100vh`-layouts. Op een telefoon of tablet is de inhoud afgekapt of onbruikbaar, terwijl Tom vacatures ook onderweg wil bekijken en er sollicitaties op wil bijhouden. Er is geen enkele `@media`-regel in de codebase (enkel `viewport` meta-tag aanwezig).

## What Changes

- Breakpoints en responsive design-tokens (telefoon < 640px, tablet 640–1023px, desktop ≥ 1024px) toevoegen.
- Navigatie: op telefoon/tablet verdwijnt de zijbalk; een hamburgerknop in de header opent een slide-over drawer (sluit bij navigatie, backdrop-klik en Escape).
- Vacaturelijst: onder het desktop-breakpoint wordt de tabel vervangen door een kaartenlijst (titel/functie-badge, bedrijf, status, locatie, match, tags, favoriet, sollicitatie-actie). Desktop behoudt de tabel.
- Statusstrip (`StatsCounter`), `FilterPills`, `SearchBar` en paginaheaders: horizontaal scrollbaar of wrapping op smalle schermen, zonder horizontale paginascroll.
- Sollicitatiespagina (`ApplicationsPanel`): tabel wordt kaartenlijst op smalle schermen; vaste kolombreedtes verdwijnen.
- Detailpagina (`/vacatures/$id`) en login: padding/typografie schalen mee; actieknoppen stapelen.
- Touch: interactieve elementen ≥ 44×44px op touch-apparaten; de "Solliciteer"-knop is niet meer hover-only (`opacity: 0`) op touch.
- Layout gebruikt `100dvh` i.p.v. `100vh` zodat de mobiele adresbalk geen inhoud afknipt.
- Playwright-viewporttests (telefoon + tablet) voor de golden paths: navigeren, lijst bekijken, zoeken/filteren, solliciteren.

**Buiten scope:** dark mode, print-stijlen, native app/PWA/offline, ultrawide-layouts (> 1600px), nieuwe functionaliteit of wijzigingen in sorteer-/filterlogica, redesign van kleuren of typografie.

**Firestore / sync:** raakt het Firestore-model, de queries en `data/firestore-sync-input.json` **niet**. Enkel UI (CSS + componenten) en e2e-tests.

## Capabilities

### New Capabilities
- `responsive-layout`: app-shell, navigatie, statusstrip/filters/zoekbalk, detail-, sollicitaties- en loginpagina passen zich aan telefoon, tablet en desktop aan; geen horizontale paginascroll; touch-targets en dynamische viewporthoogte.
- `responsive-vacancy-list`: de vacaturelijst toont een tabel op desktop en een kaartenlijst op kleinere schermen, met dezelfde acties en infinite scroll.

### Modified Capabilities
<!-- Geen: `openspec/specs/` bevat nog geen bestaande specs. -->

## Impact

- CSS: `app/styles/tokens.css`, `global.css`, `components/layout/*`, `VacancyTable`, `StatsCounter`, `FilterPills`, `SearchBar`, `ApplicationsPanel`, `ApplyForJob`, `FavoriteButton`, `routes/vacatures/*`, `LoginPage`.
- Componenten: `Header`/`Nav`/`AppShell` (drawer-state), `VacancyTable` (kaartweergave), `ApplicationsPanel`.
- Tests: Vitest-componenttests naast de code, nieuwe Playwright-specs met mobiele viewports (`playwright.config.ts` krijgt mobiele projecten).
- Geen nieuwe dependencies verwacht (CSS media/container queries + `matchMedia`).
