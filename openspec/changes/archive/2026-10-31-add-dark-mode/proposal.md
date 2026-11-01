## Why

De app heeft enkel een licht thema. Tom gebruikt de app op meerdere toestellen (nu ook op telefoon, zie `make-app-responsive`) en 's avonds is een wit scherm hinderlijk. Alle kleuren staan al in `app/styles/tokens.css`, dus een tweede kleurenset is nu goedkoop toe te voegen.

## What Changes

- Een donker thema: tweede set waarden voor de `--color-*`-tokens (neutraal, tekst, accent, status, bron, functie, badges) via `[data-theme="dark"]`.
- Themakeuze met drie standen: `auto` (volgt `prefers-color-scheme`, standaard), `light` en `dark`; de keuze wordt bewaard in `localStorage`.
- Een inline script in `index.html` zet `data-theme` vóór de eerste paint, zodat er geen flits van het verkeerde thema is.
- `color-scheme` wordt gezet zodat scrollbars, formulierelementen en selectie meeschakelen.
- Een themakeuze met drie opties (Auto, Licht, Donker) als segmented control onderaan de navigatie: de permanente zijbalk op desktop en de drawer op telefoon en tablet. De header blijft ongewijzigd.
- Het drawer-backdrop (`rgb(0 0 0 / 40%)`) wordt een token.
- Playwright-tests met `colorScheme: 'dark'` en een contrastcontrole van de tokenparen (WCAG AA).

**Buiten scope:** een themaknop in de header, een themakeuze op de loginpagina (die volgt de bewaarde of systeemvoorkeur), themasynchronisatie via Firestore of per gebruiker, meer dan twee thema's, een themakiezer met voorbeeldkleuren, het Google Fonts-`@import`, en aanpassingen aan de vacaturelijst of andere functionaliteit.

**Data:** raakt het Firestore-model en `data/firestore-sync-input.json` niet. De voorkeur staat enkel in `localStorage`.

## Capabilities

### New Capabilities
- `theme`: licht/donker thema met automatische systeemkeuze, handmatige override, persistentie en geen flits bij laden.

### Modified Capabilities
Geen. De header verandert niet; de themakeuze zit in de navigatie en moet daar de bestaande eisen van `responsive-layout` (geen horizontale scroll op 320px, drawer-gedrag) blijven halen. Dat wordt in de bestaande responsive-tests gecontroleerd.

## Impact

- `app/styles/tokens.css`, `app/styles/global.css` (`color-scheme`)
- `index.html` (inline script)
- Nieuw: `app/lib/theme.ts` (+ test), `app/lib/useTheme.ts`
- `app/components/layout/Nav.tsx` + CSS (themakeuze), `AppShell.tsx` (hook-koppeling), `AppShell.module.css` (backdrop-token)
- `e2e/` (dark-mode spec), `docs/architecture.md`
