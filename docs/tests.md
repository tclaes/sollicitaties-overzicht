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
