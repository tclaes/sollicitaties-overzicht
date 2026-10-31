# Design

## Context

Zie proposal.md voor motivatie. Huidige stand (geobserveerd in de code):

- Geen `@media`-regels; alleen `<meta name="viewport">`. CSS Modules + tokens in `app/styles/tokens.css` (`--sidebar-width: 200px`, `--header-height: 44px`).
- `AppShell`: grid met `height: 100vh; overflow: hidden`, body-grid `var(--sidebar-width) 1fr`; `.content` scrolt intern (`overflow-y: auto`).
- `Nav` is altijd zichtbaar; `Header` heeft logo + uitloggen.
- `VacancyTable`: `table-layout: fixed` met vaste kolommen (36+116+66+160+150+66+200 px ≈ 800px + Functie-kolom). `ApplyForJob` knop is `opacity: 0` tot rij-hover.
- `ApplicationsPanel`: tabel met vaste breedtes (64/140/130px) in `overflow-x: auto`.
- `StatsCounter`: `display:flex` met 6 items `flex: 1` en `padding: 12px 20px` → past niet op 375px.
- `FilterPills`, `SearchBar` wrappen al (`flex-wrap`), maar touch-targets zijn klein (pill ~22px hoog, checkbox native).
- Detail-pagina: `max-width: 720px`, `padding: 32px 24px`, article-padding 32px.
- Tests: Vitest naast de code, Playwright (`e2e/`, enkel desktop-Chrome project).

## Goals / Non-Goals

**Goals:**
- Eén coherente responsive aanpak (tokens + conventie) voor alle pagina's.
- Geen duplicatie van rij-logica tussen tabel en kaart.
- Verifieerbaar via Playwright op mobiele viewports.

**Non-Goals:**
- Geen nieuw designsysteem, geen CSS-framework, geen dependencies.
- Geen wijziging aan filter-/sorteer-/infinite-scroll-logica, Firestore-queries of het archief.
- Geen dark mode, print, PWA.

## Decisions

1. **Breakpoints als CSS custom media-conventie, mobile-first `min-width`.**
   Waarden: 640px en 1024px. CSS custom properties werken niet in `@media`, dus de waarden staan als documentatie in `tokens.css` (commentaar) en worden letterlijk herhaald; een kleine TS-constante (`app/lib/breakpoints.ts`) voor `matchMedia`. *Alternatief:* PostCSS `@custom-media` — extra tooling, niet nodig (YAGNI). Stylelint blijft gelden (`lint:css`).

2. **Drawer-navigatie met state in `AppShell` (smart), `Nav`/`Header` blijven dumb.**
   `AppShell` houdt `navOpen`; `Header` krijgt een hamburgerknop (`aria-expanded`, `aria-controls`), `Nav` rendert in een drawer-container. Onder 1024px: `position: fixed` drawer + backdrop, `transform: translateX`, focus-management (focus in drawer bij openen, terug naar knop bij sluiten, Escape sluit). Op desktop blijft het huidige grid. De drawer sluit bij route-wijziging (links zijn gewone `<a href>`: volledige navigatie, dus automatisch). *Alternatief:* bottom tab bar — verworpen door Tom; native `<dialog>` — overwogen, maar backdrop/focus-trap via `<dialog>.showModal()` is bruikbaar en levert Escape + focus gratis; **voorkeur: `<dialog>`-loze eigen implementatie vermijden en `showModal()` gebruiken indien jsdom-tests dat toelaten**, anders eigen implementatie.

3. **Tabel ↔ kaarten via `useMediaQuery('(min-width: 1024px)')`, niet via beide renderen + CSS verbergen.**
   Beide renderen verdubbelt DOM (en ApplyForJob/FavoriteButton-state, e2e-selectors, a11y). Een hook (`app/lib/useMediaQuery.ts`) kiest één weergave. Rij-state (`locallyApplied`, `favoriteOverrides`, `statusOverrides`, handlers) wordt uit `VacancyTable` gehaald naar een hook/gedeelde parent zodat `VacancyTable` en nieuwe `VacancyCardList` ze delen. Initiële waarde synchroon via `matchMedia(...).matches` (SPA, geen SSR) om flits te vermijden. *Alternatief:* CSS-only transformatie van `<table>` naar blokken (`display:block` op tr/td) — breekt tabelsemantiek en is moeilijk om te stylen met bestaande kolomklassen.

4. **`ApplicationsPanel` krijgt dezelfde aanpak, maar eenvoudiger:** onder 640px via CSS grid per rij (datum + status op één lijn, bedrijf/functie eronder) in plaats van een tweede component; de rij blijft één `<tr>`-structuur → omgezet naar `display:grid` binnen een media query. Enkel als dit schoon blijft; anders zelfde kaart-aanpak als decision 3.

5. **Statusstrip: horizontaal scrollbare strip** (`overflow-x: auto; scroll-snap-type: x proximity`, items `flex: 0 0 auto`) onder 1024px, met de actieve status in beeld via `scrollIntoView({inline: 'center'})` bij mount. *Alternatief:* 2×3 grid — toont alles, maar neemt ~120px hoogte van het scherm.

6. **Touch via capabilities, niet via breedte:** `@media (pointer: coarse)` voor 44px-targets (min-height/min-width of padding, visuele grootte blijft waar mogelijk), `@media (hover: none)` om `ApplyForJob` permanent te tonen. Dit dekt ook touch-laptops/tablets correct.

7. **`100vh` → `100dvh`** in `AppShell` en `LoginPage` met `100vh` als fallback-regel ervoor. `.wrapper { min-height: 80vh }` van de tabel wordt `min-height` relatief aan de container i.p.v. viewport-hoogte op kleine schermen.

8. **Detail/login:** `--space-8` paddings worden onder 640px `--space-4`; footer-acties `flex-wrap`/kolom. Geen structurele wijzigingen.

9. **Verificatie:** Playwright-projecten `mobile` (Pixel 7 / 412px) en `tablet` (iPad Mini / 768px) draaien een nieuwe `e2e/responsive.spec.ts`; bestaande desktop-specs blijven op het desktopproject (anders breken selectors op `table`). Assertie op horizontale overflow via `scrollWidth <= innerWidth`. Vitest-tests voor `useMediaQuery`, kaartweergave en drawer (met gemockte `matchMedia`).

## Risks / Trade-offs

- [Bestaande e2e-selectors gaan uit van tabelrijen (`.vacancy-row`)] → Specs expliciet aan desktopproject koppelen; kaarten krijgen een eigen testbare rol/`data-testid`.
- [Dubbele weergave kan gedrag laten divergeren] → Gedeelde rij-state/hook en gedeelde `ApplyForJob`/`FavoriteButton`/`Badge`-componenten; één set van gedragstests parametriseren over beide weergaven.
- [`matchMedia` in jsdom ontbreekt] → Test-setup polyfill/mock in Vitest setup.
- [Drawer-focusbeheer is foutgevoelig] → Voorkeur voor `<dialog>.showModal()`; anders expliciete tests voor Escape/backdrop/focus-terugkeer.
- [44px-targets maken desktop-dichtheid niet slechter] → Alleen onder `pointer: coarse`.
- [Google Fonts `@import` blokkeert render op trage mobiele netwerken] → Buiten scope, wel genoteerd; eventueel apart oppakken.

## Migration Plan

Pure frontend; geen data-migratie. Uitrol via gewone PR (`feature/responsive`), per taakgroep afzonderlijk mergebaar (shell → lijst → overige pagina's). Rollback = revert van de PR(s).

## Open Questions

- Moet de header-titel/logo op telefoon korter ("Sollicitaties" blijft nu)? Kan tijdens implementatie visueel beslist worden.
