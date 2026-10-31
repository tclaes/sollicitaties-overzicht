# Tasks

## 1. Fundament

- [x] 1.1 Voeg `app/lib/breakpoints.ts` (640/1024) en `app/lib/useMediaQuery.ts` toe; Vitest-test met gemockte `matchMedia` (initiële waarde synchroon, update bij change). Verifieer met `npm test`.
- [x] 1.2 Documenteer breakpoints/conventie (mobile-first `min-width`, `pointer: coarse`, `hover: none`) in `tokens.css` en `docs/architecture.md`; verifieer met `npm run lint:css`.
- [x] 1.3 Voeg `matchMedia`-mock toe aan de Vitest-setup; verifieer dat bestaande tests groen blijven.
- [x] 1.4 Voeg Playwright-projecten `mobile` (412px) en `tablet` (768px) toe aan `playwright.config.ts`; bestaande specs blijven op `chromium`. Verifieer met `npm run test:e2e` dat de desktop-specs ongewijzigd slagen.

## 2. App-shell en navigatie

- [x] 2.1 `AppShell`: `100vh` → `100dvh` (met fallback), body-grid enkel op ≥ 1024px; verifieer visueel op 375/768/1280px.
- [x] 2.2 `Header` hamburgerknop (`aria-label`, `aria-expanded`, `aria-controls`) en `Nav` als drawer met backdrop onder 1024px; state in `AppShell`. Vitest: open, sluit via Escape/backdrop/link, focus-terugkeer, `aria-expanded`.
- [x] 2.3 Playwright (`mobile`): drawer openen, naar "Sollicitaties" navigeren, drawer is gesloten; verifieer dat de test slaagt.

## 3. Vacaturelijst

- [x] 3.1 Extraheer rij-state/handlers (`locallyApplied`, `favoriteOverrides`, `statusOverrides`) uit `VacancyTable` naar een gedeelde hook; verifieer dat bestaande `VacancyTable`-tests ongewijzigd slagen.
- [x] 3.2 Nieuwe `VacancyCardList` (+ CSS-module) met titel, functie-badge, bedrijf, status, bron, locatie, match, ≤ 3 tags, favoriet en `ApplyForJob`; kaartklik navigeert, actieknoppen niet. Vitest: kaart met/zonder match en function, favoriet navigeert niet, solliciteren toont datum/status, lege toestand.
- [x] 3.3 Kies tabel of kaarten met `useMediaQuery` in de vacatures-route (infinite-scroll footer ongewijzigd). Vitest: 1280px → tabel, 375px → kaarten.
- [x] 3.4 `ApplyForJob` permanent zichtbaar bij `hover: none`; datumveld/knoppen passen op 320px. Verifieer visueel + Playwright (`mobile`): solliciteren vanaf kaart.
- [x] 3.5 `min-height: 80vh` van `VacancyTable`-wrapper herzien voor kleine schermen; verifieer dat het einde van de lijst bereikbaar is.

## 4. Statusstrip, filters, zoekbalk, paginaheaders

- [x] 4.1 `StatsCounter`: horizontaal scrollbare strip met actieve status in beeld onder 1024px. Vitest/Playwright: alle 6 statussen bereikbaar op 375px, geen paginaoverflow.
- [x] 4.2 `SearchBar` en `FilterPills`: volle breedte input, nette wrap, 44px-targets onder `pointer: coarse`. Playwright (`mobile`): zoeken + filter behoudt selectie (hergebruik search-golden path).
- [x] 4.3 Paginaheaders (`vacatures`, `sollicitaties`) en `SearchHint`: padding via responsive spacing; verifieer geen overflow op 320px.

## 5. Sollicitaties, detail en login

- [x] 5.1 `ApplicationsPanel`: vaste kolombreedtes vervangen door responsive layout onder 640px; Vitest: status-select wijzigt status. Verifieer visueel op 375px.
- [x] 5.2 Detailpagina (`/vacatures/$id`): padding/typografie schalen, footer/actions stapelen; verifieer geen overflow op 320px en dat acties bereikbaar zijn.
- [x] 5.3 `LoginPage`: `100dvh`, card-padding en max-width op smalle schermen; Playwright (`mobile`): inloggen werkt.
- [x] 5.4 Touch-targets ≥ 44px onder `pointer: coarse` voor favoriet, nav-links, pills, status-select, checkbox; verifieer met Playwright `boundingBox()` op `mobile`.

## 6. Integratie

- [x] 6.1 Nieuwe `e2e/responsive.spec.ts`: voor 320/375/768px op elke hoofdpagina `scrollWidth <= innerWidth`; verifieer met `npm run test:e2e`.
- [x] 6.2 Draai `npm test`, `npm run lint`, `npm run lint:css`, `npm run lint:sheriff` en `npm run test:e2e`; alles groen.
- [x] 6.3 Werk `docs/architecture.md` en `docs/tests.md` bij (breakpoints, viewport-projecten); verifieer dat de beschreven commando's werken.
