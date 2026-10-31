## 1. Themalogica

- [x] 1.1 `app/lib/theme.ts`: `ThemePreference`, `readPreference` (ongeldig of storage-fout → `auto`), `savePreference`, `resolveTheme`, `applyTheme` (zet `data-theme`), sleutel `vacature-theme`
- [x] 1.2 Vitest `app/lib/theme.test.ts`: alle scenario's uit de spec (systeem donker/licht, override, ongeldige waarde)
- [x] 1.3 `app/lib/useTheme.ts`: voorkeur in state, luistert op `prefers-color-scheme` in stand `auto`, past thema toe en bewaart keuze
- [x] 1.4 Vitest `useTheme.test.tsx`: wissel van stand, systeemwijziging in `auto`, persistentie

## 2. Geen flits en native elementen

- [x] 2.1 Inline script in `index.html` (vóór `#root`) dat voorkeur leest en `data-theme` zet; `<meta name="color-scheme">` en `theme-color` toevoegen
- [x] 2.2 Vitest die de scripttekst uit `index.html` uitvoert en dezelfde cases als `theme.ts` controleert
- [x] 2.3 `color-scheme` in `global.css`/`tokens.css` (`light` voor `:root`, `dark` voor `[data-theme="dark"]`)

## 3. Donkere tokens

- [x] 3.1 Donkere neutrale, tekst- en accenttokens in `tokens.css` onder `[data-theme="dark"]` (`--color-accent` `#60a5fa`, lichtere `--color-accent-hover`, getinte `accent-subtle`/`accent-text`)
- [x] 3.1a Nieuwe tokens `--color-accent-solid` (`#2563eb`) en `--color-accent-solid-hover` (`#1d4ed8`) in `:root` (waarden gelijk in beide thema's); `CLink.module.css` gebruikt ze voor `--_bg-color` en de hover; controleer met `grep` dat geen andere CSS `--color-accent` als achtergrond met `--color-text-inverse` gebruikt
- [x] 3.2 Donkere status-, bron-, functie- en badgetokens
- [x] 3.3 `--color-backdrop` token (licht en donker) en gebruik in `AppShell.module.css`
- [x] 3.4 `grep` op hardcoded kleuren in SVG's en inline stijlen in `app/` en vervang ze door tokens
- [x] 3.5 Vitest-contrasttest: parse tokens uit `tokens.css`, bereken contrast per tekst/achtergrond-paar en eis ≥ 4,5:1 in donker (en licht als regressienet); inclusief `--color-text-inverse` op `--color-accent-solid` (en `-hover`) en `--color-accent` op `--color-surface` als aparte paren; rand/outline-accent op surface minstens 3:1

## 4. Themakeuze in de navigatie

- [x] 4.1 `ThemeSelect` (dumb, naast `Nav`): radiogroep Auto/Licht/Donker met `role="radiogroup"`/`radio`, `aria-checked`, roving tabindex en pijltjestoetsen; waarde en `onChange` via props
- [x] 4.2 CSS-module voor `ThemeSelect` (segmented control, tokens, alfabetische properties) met 44px raakdoelen onder `pointer: coarse`; geen horizontale overflow in de drawer op 320px
- [x] 4.3 `Nav.tsx` toont onderaan een sectie "Weergave" met `ThemeSelect`; `AppShell.tsx` roept `useTheme` aan en geeft waarde en callback door; kiezen sluit de drawer niet
- [x] 4.4 Vitest `ThemeSelect.test.tsx` en `AppShell.test.tsx`: huidige stand gemarkeerd, kiezen past `data-theme` aan en laat de drawer open, toetsenbordbediening

## 5. End-to-end en docs

- [x] 5.1 `e2e/theme.spec.ts` (project `chromium`): `colorScheme: 'dark'` geeft `data-theme="dark"`, keuze via de themaradiogroep in de zijbalk, persistentie na reload, attribuut staat direct na `domcontentloaded`
- [x] 5.2 Controleer dat de bestaande responsive-specs (320px zonder horizontale scroll) nog slagen met de themakeuze in de drawer
- [x] 5.3 Handmatige visuele check in donker: vacaturelijst (tabel + kaarten), detail, sollicitaties, login en drawer
- [x] 5.4 `docs/architecture.md`: sectie Thema (tokens, `data-theme`, inline script, hoe een nieuw token in beide thema's toevoegen) en `docs/tests.md`
- [x] 5.5 `npm test`, `npm run test:e2e`, `lint:css`, `lint:sheriff` en build groen
