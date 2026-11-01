# theme Specification

## Purpose

Biedt een licht en een donker thema met een automatische systeemkeuze en een handmatige override die bewaard blijft, zonder flits bij het laden en met voldoende contrast.

## Requirements

### Requirement: Themastanden
De app SHALL drie themastanden ondersteunen: `auto`, `light` en `dark`. De standaardstand MUST `auto` zijn.

#### Scenario: Standaard volgt het systeem
- **WHEN** er geen bewaarde voorkeur is en het systeem `prefers-color-scheme: dark` meldt
- **THEN** staat `data-theme="dark"` op het `html`-element

#### Scenario: Systeem is licht
- **WHEN** er geen bewaarde voorkeur is en het systeem `prefers-color-scheme: light` meldt
- **THEN** staat `data-theme="light"` op het `html`-element

#### Scenario: Handmatige keuze wint van het systeem
- **WHEN** de voorkeur `light` is bewaard en het systeem donker is
- **THEN** staat `data-theme="light"` op het `html`-element

### Requirement: Voorkeur bewaren
De gekozen themastand MUST bewaard blijven in `localStorage` en bij het volgende bezoek worden toegepast. Een ongeldige of ontbrekende waarde SHALL als `auto` behandeld worden.

#### Scenario: Voorkeur blijft na herladen
- **WHEN** de gebruiker `dark` kiest en de pagina herlaadt
- **THEN** is het thema nog steeds donker

#### Scenario: Ongeldige opgeslagen waarde
- **WHEN** `localStorage` een onbekende themawaarde bevat
- **THEN** valt de app terug op `auto` zonder fout

### Requirement: Geen flits bij laden
Het thema MUST toegepast zijn vóór de eerste paint, zodat er geen kortstondig verkeerd thema zichtbaar is.

#### Scenario: Donkere voorkeur bij laden
- **WHEN** de voorkeur `dark` is bewaard en de pagina laadt
- **THEN** staat `data-theme="dark"` al op het `html`-element voordat de React-app gemount is

### Requirement: Themakeuze in de navigatie
De navigatie (permanente zijbalk op desktop, drawer op telefoon en tablet) SHALL een themakeuze tonen met de drie opties Auto, Licht en Donker als radiogroep. De huidige stand MUST zichtbaar zijn en de header MUST ongewijzigd blijven.

#### Scenario: Optie kiezen
- **WHEN** de gebruiker in de themakeuze "Donker" aantikt
- **THEN** staat `data-theme="dark"` op het `html`-element, is "Donker" als gekozen gemarkeerd en blijft de drawer open

#### Scenario: Huidige stand zichtbaar
- **WHEN** de voorkeur `auto` is bewaard en de navigatie wordt getoond
- **THEN** is "Auto" gemarkeerd als gekozen en zijn "Licht" en "Donker" dat niet

#### Scenario: Toegankelijkheid
- **WHEN** de themakeuze wordt gerenderd
- **THEN** heeft de groep een toegankelijke naam, heeft elke optie `role="radio"` met een `aria-checked`-waarde en is de keuze met het toetsenbord bedienbaar

#### Scenario: Bereikbaar op telefoon
- **WHEN** de drawer op 375px breed wordt geopend
- **THEN** is de themakeuze zichtbaar zonder horizontale scroll en heeft elke optie een raakdoel van minstens 44px

#### Scenario: Systeemwijziging in auto
- **WHEN** de stand `auto` is en het systeemthema wisselt terwijl de app open staat
- **THEN** past de app het thema aan zonder herladen

### Requirement: Leesbaar donker thema
In het donkere thema MUST alle tekst/achtergrond-paren van de tokens (hoofdtekst, gedempte tekst, accent, status, bron, functie en badges) een contrastverhouding van minstens 4,5:1 halen.

#### Scenario: Contrastcontrole tokens
- **WHEN** de contrasttest de donkere tokenparen berekent
- **THEN** haalt elk paar minstens 4,5:1

#### Scenario: Accent als tekst en als knopvulling
- **WHEN** het donkere thema actief is
- **THEN** haalt `--color-accent` op `--color-surface` minstens 4,5:1 en haalt `--color-text-inverse` op `--color-accent-solid` minstens 4,5:1

#### Scenario: Focusring en rand
- **WHEN** het donkere thema actief is
- **THEN** haalt `--color-accent` (focus-outline en actieve rand) op `--color-surface` minstens 3:1

#### Scenario: Statusbadges in donker thema
- **WHEN** een vacature met status `gesolliciteerd` in het donkere thema wordt getoond
- **THEN** zijn badge-achtergrond en -tekst afkomstig van de donkere statustokens en is de tekst leesbaar

### Requirement: Native elementen volgen het thema
De app SHALL `color-scheme` instellen zodat scrollbars en formulierelementen met het actieve thema meeschakelen.

#### Scenario: Donker formulierelement
- **WHEN** het donkere thema actief is
- **THEN** is `color-scheme` van het `html`-element `dark`
