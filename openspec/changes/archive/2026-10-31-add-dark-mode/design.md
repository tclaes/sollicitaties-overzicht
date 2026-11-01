# Design

## Context

- Alle kleuren staan als `--color-*` in `app/styles/tokens.css`; stylelint (`color-no-hex`) verbiedt hex buiten dat bestand. Enige uitzondering in componenten: `rgb(0 0 0 / 40%)` in `AppShell.module.css` (drawer-backdrop).
- Er is geen bestaand themamechanisme en geen `color-scheme`. De app is een client-side SPA (`index.html` mount `#root`), dus zonder ingreep komt het thema pas na JS-hydratatie.
- De header bevat hamburger (enkel kleine schermen), logo en "Uitloggen" en is op 320px met 44px-raakdoelen al krap (geschat ~340px bij een extra knop). De navigatie (`Nav`) is de zijbalk op desktop en de drawer op kleinere schermen. Hooks in `app/lib/` (bv. `useMediaQuery`) zijn de vaste plek voor gedeelde logica; Vitest-setup stubt `matchMedia` met desktop-defaults.

## Goals / Non-Goals

**Goals:**
- Geen componentwijzigingen nodig voor de kleuren: enkel tokenwaarden wisselen.
- Geen thema-flits bij laden.
- Eén bron van waarheid voor de themalogica, testbaar zonder DOM-framework.

**Non-Goals:**
- Synchronisatie tussen toestellen (Firestore).
- Meer dan twee kleurenschema's of door de gebruiker instelbare kleuren.

## Decisions

**1. `data-theme` op `<html>` met de effectieve waarde (`light` | `dark`).**
`auto` wordt vóór het zetten van het attribuut opgelost via `matchMedia('(prefers-color-scheme: dark)')`. CSS kent dus maar twee blokken: `:root` (licht) en `[data-theme="dark"]`.
*Alternatief:* `@media (prefers-color-scheme: dark)` plus override-selector. Dat dupliceert de donkere tokens (media query én attribuut) en laat twee bronnen van waarheid ontstaan. Verworpen.

**2. Pure logica in `app/lib/theme.ts`, hook in `app/lib/useTheme.ts`.**
`theme.ts` bevat: `type ThemePreference = "auto" | "light" | "dark"`, `readPreference()` (ongeldig of storage-fout → `auto`), `savePreference()`, `resolveTheme(pref, systemDark)`, en `applyTheme()`. De hook houdt de voorkeur in state, luistert op de `matchMedia`-change in stand `auto` en roept `applyTheme` aan. Zo volgen we de smart/dumb-splitsing: `AppShell` roept de hook aan en geeft waarde en callback door aan `Nav`.
*Storage-sleutel:* `vacature-theme`, in lijn met bestaande `vacature-sollicitaties`.

**3. Inline script in `index.html` (blokkerend, vóór `<div id="root">`).**
Een klein, afhankelijkheidsvrij script herhaalt de leeslogica (sleutel + `matchMedia`) en zet `data-theme` en `color-scheme` vóór de eerste paint. Dit is bewust gedupliceerde logica, want het moet buiten de bundel draaien. Een Vitest-test voert de scripttekst uit tegen dezelfde cases als `theme.ts`, zodat de twee niet uit elkaar lopen.
*Alternatief:* themaklasse zetten in `main.tsx`. Dat draait pas na bundel-load en geeft de flits. Verworpen.

**4. `color-scheme` via CSS: `:root { color-scheme: light }` en `[data-theme="dark"] { color-scheme: dark }`.**
Plus `<meta name="color-scheme" content="light dark">` in `index.html` voor de eerste paint, en `<meta name="theme-color">` voor de adresbalk op telefoon wordt door het inline script bijgewerkt.

**5. Donkere palet: handmatig afgestemd, contrast getest.**
- Neutraal: `bg` ~ `#121211`, `surface` ~ `#1c1c1a`, randen iets lichter dan surface; tekst omgekeerd.
- Status/bron/functie/badges: donkere, ingetogen achtergrond (accentkleur ~15% op surface) met lichte tekst in dezelfde kleurfamilie; dot-kleuren blijven helder.
- Accent: `--color-accent` is in de code drie dingen tegelijk (knopvulling in `CLink`/`.cta`, voorgrondtekst in o.a. `SearchHint`, `InfiniteScrollFooter` en `$id.module.css`, en rand/outline voor focus, `SearchBar` en `LoginPage`). In licht werkt één blauw (`#2563eb`) voor alles; in donker niet: `#2563eb` als tekst op het donkere oppervlak haalt 3,30:1 (< 4,5) en wit op `#60a5fa` haalt 2,54:1. Daarom wordt het gesplitst:
  - `--color-accent` (voorgrond, rand, outline): licht `#2563eb`, donker `#60a5fa` (6,71:1 op surface).
  - `--color-accent-hover` (hovertekst): in donker lichter dan `--color-accent` (bv. `#93c5fd`, 9,46:1).
  - **Nieuw** `--color-accent-solid` (knopvulling, met `--color-text-inverse`): `#2563eb` in beide thema's (wit erop: 5,17:1).
  - **Nieuw** `--color-accent-solid-hover` (hover van de vulling): `#1d4ed8` in beide thema's (wit erop: 6,70:1).
  - `--color-accent-subtle` en `--color-accent-text` blijven een paar: in donker een getinte donkere achtergrond met lichte blauwe tekst.
  - Enige verbruiker van de vulling is `CLink.module.css` (`--_bg-color` en de hover); die schakelt over op de solid-tokens. `--bg-color` blijft een overschrijfpunt voor aanroepers.
  Gekozen boven het omdraaien van `--color-text-inverse` in donker: dat geeft dat token verborgen betekenis en verandert het uiterlijk van de knoppen.
De exacte waarden worden bij implementatie vastgelegd en door een Vitest-test op 4,5:1 gecontroleerd (tokens uit `tokens.css` parsen, relatieve luminantie berekenen). Dit geldt als regressienet voor toekomstige tokens.

**6. Themakeuze als segmented control in de navigatie (`Auto | Licht | Donker`).**
Onderaan `Nav`, onder een sectielabel "Weergave", als `role="radiogroup"` met drie `role="radio"`-knoppen (`aria-checked`, pijltjestoetsen via roving tabindex). Eén plaats voor alle viewports: de zijbalk op desktop en de drawer op telefoon/tablet, dus de krappe header (320px) wordt niet aangeraakt. Alle drie de standen zijn zichtbaar, zodat "auto" niet verborgen zit achter een icoon. Kiezen sluit de drawer niet. Onder `pointer: coarse` krijgt elke optie een 44px raakdoel; de groep past in de drawerbreedte (`min(80vw, 280px)`, ruim voor drie opties).
*Alternatieven:* (a) cyclusknop in de header: te krap op 320px en verbergt de huidige stand; (b) header op desktop en drawer op telefoon: twee renderpaden voor één instelling. Beide verworpen. Nadeel van de gekozen opzet: op telefoon één tik dieper (hamburger eerst); aanvaardbaar omdat het een zelden gewijzigde voorkeur is en `auto` de standaard is.
De loginpagina heeft geen navigatie en dus geen keuze; ze volgt de bewaarde of systeemvoorkeur.

**7. Backdrop-token.** `--color-backdrop: rgb(0 0 0 / 40%)` in `:root`; in donker iets sterker (`/ 60%`) zodat de overlay zichtbaar blijft. `rgb()` is toegelaten buiten hex-verbod.

**8. Tests.** Vitest voor `theme.ts`, `useTheme`, het inline script en de contrastcontrole. Playwright: nieuwe `e2e/theme.spec.ts` met `colorScheme: 'dark'` (auto volgt systeem, keuze via de radiogroep, persistentie na reload, geen flits via `addInitScript`-onafhankelijke check dat attribuut direct na `domcontentloaded` staat). Draait in het bestaande `chromium`-project.

## Risks / Trade-offs

- **Contrast van pastelparen na inversie** → contrasttest in CI en handmatige visuele check op vacaturelijst, detail en sollicitaties.
- **`--color-accent` was knopvulling én tekstkleur; in donker zijn dat twee behoeften** → opgelost met `--color-accent-solid` en `--color-accent-solid-hover` (beslissing 5). Risico: een toekomstige verbruiker gebruikt per ongeluk het verkeerde token → de contrasttest dekt beide paren (solid op inverse en accent op surface) apart.
- **Duplicatie van leeslogica in het inline script** → test die beide implementaties tegen dezelfde cases draait.
- **CSP**: er is geen CSP-header in de repo; een inline script is dan toegelaten. Zodra een CSP wordt toegevoegd, is een hash/nonce nodig.
- **Hardcoded kleuren in SVG's of inline stijlen** → tijdens implementatie `grep` op `fill=`/`stroke=`/`style=` in `app/`.

## Migration Plan

Geen datamigratie. Standaardstand `auto` betekent dat gebruikers met een donker systeem de wijziging meteen zien. Terugdraaien = PR terugdraaien; `localStorage`-sleutel blijft onschadelijk achter.
