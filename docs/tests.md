## Testing

- Maak een test voor elke nieuwe feature / bug
- `npm test` — unit- en componenttests (Vitest via de Vite+-toolchain, éénmalig `vp test`), draait ook in CI
  (`build-en-test`).
- `npm run test:e2e` — e2e-tests (Playwright) tegen de golden paths (inloggen,
  solliciteren, niet interessant markeren/herstellen). Draait volledig tegen de **Firebase-emulators** (Firestore +
  Auth) met vaste fixture-data uit `e2e/seed.ts`
  — nooit tegen de echte productie-Firestore. `firebase emulators:exec` start de
  emulators, seedt data via Playwright's `globalSetup`, en start zelf ook
  `vp dev` (zie `playwright.config.ts`).
    - Vereist een lokale Java-runtime (voor de Firestore-emulator), bv.
      `brew install openjdk@21` en dan `/opt/homebrew/opt/openjdk@21/bin` op het PATH.
    - CI installeert Java (`actions/setup-java`) en Playwright's Chromium zelf; geen
      Firebase-secrets nodig, want de emulators draaien tegen een dummy `demo-test`-project.

Testbestanden staan naast de code die ze testen (`*.test.ts(x)`); e2e-specs staan in
`e2e/*.spec.ts`.

### Responsive (viewports)

- Playwright heeft drie projecten: `chromium` (desktop, alle gewone specs), `mobile` (Pixel 7, 412px) en `tablet`
  (768px). Specs met een bestandsnaam `e2e/responsive*.spec.ts` draaien enkel op `mobile` en `tablet`; alle andere
  specs enkel op `chromium` (ze gaan uit van de tabel).
- Mobile en tablet draaien parallel op dezelfde emulator-data: een spec die data wijzigt heeft een eigen fixture per
  project nodig (zie `applyMobile`/`applyTablet` in `e2e/seed.ts`).
- Vitest: `window.matchMedia` is in `vitest.setup.ts` gestubd (desktop); stub het zelf in een test voor een kleine
  weergave.

### Thema (licht/donker)

- `e2e/theme.spec.ts` (desktop, `chromium`) test met `colorScheme: 'dark' | 'light'` of het systeemthema, de keuze in de
  zijbalk, persistentie na reload en het ontbreken van een flits (de app-bundel wordt geblokkeerd; enkel het inline script
  in `index.html` kan dan nog `data-theme` zetten).
- `e2e/responsive-theme.spec.ts` draait op `mobile`/`tablet`: de keuze zit in de drawer en veroorzaakt geen horizontale
  overflow op 320/375px.
- Vitest: `tokens.test.ts` bewaakt contrast en volledigheid van de donkere tokens.
- Let op: Playwright hergebruikt een dev-server die al op :5173 draait (`reuseExistingServer`). Een server zonder
  emulator-env laat elke `login()` time-outen; stop eerst je eigen `npm run dev` vóór `npm run test:e2e`.

