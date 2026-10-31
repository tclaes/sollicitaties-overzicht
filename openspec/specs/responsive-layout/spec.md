# responsive-layout Specification

## Purpose

Zorgt dat de volledige app bruikbaar is op telefoon, tablet en desktop zonder horizontale paginascroll, met toegankelijke navigatie en touch-vriendelijke bediening.

## Requirements

### Requirement: Breakpoints
De app SHALL drie weergavemodi onderscheiden: telefoon (breedte < 640px), tablet (640px tot 1023px) en desktop (≥ 1024px).

#### Scenario: Desktop-weergave
- **WHEN** de viewportbreedte 1280px is
- **THEN** is de zijbalk permanent zichtbaar en is er geen hamburgerknop

#### Scenario: Telefoon-weergave
- **WHEN** de viewportbreedte 375px is
- **THEN** is de zijbalk niet permanent zichtbaar en toont de header een hamburgerknop

### Requirement: Geen horizontale paginascroll
Elke pagina (vacatures, vacaturedetail, sollicitaties, login) MUST op viewportbreedtes vanaf 320px passen zonder horizontale scroll van de pagina.

#### Scenario: Vacaturelijst op smalle telefoon
- **WHEN** de vacaturelijst op 320px breed wordt geladen
- **THEN** is `document.documentElement.scrollWidth` niet groter dan de viewportbreedte

#### Scenario: Sollicitatiespagina op telefoon
- **WHEN** de sollicitatiespagina op 375px breed wordt geladen
- **THEN** is er geen horizontale paginascroll

### Requirement: Navigatiedrawer op kleine schermen
Op telefoon en tablet SHALL de navigatie in een drawer staan die via de hamburgerknop opent en sluit.

#### Scenario: Drawer openen
- **WHEN** de gebruiker op de hamburgerknop tikt
- **THEN** verschijnt de navigatie als overlay met een backdrop en staat de focus in de drawer

#### Scenario: Drawer sluiten
- **WHEN** de drawer open is en de gebruiker op Escape drukt, de backdrop aantikt of een navigatielink kiest
- **THEN** sluit de drawer en keert de focus terug naar de hamburgerknop

#### Scenario: Toegankelijke knop
- **WHEN** de hamburgerknop wordt gerenderd
- **THEN** heeft hij een toegankelijke naam en een `aria-expanded`-waarde die de open/gesloten staat weergeeft

### Requirement: Statusstrip, filters en zoekbalk op smalle schermen
De statusstrip, filterpills en zoekbalk MUST bruikbaar blijven op telefoon: alle statusfilters blijven bereikbaar zonder de pagina horizontaal te laten scrollen.

#### Scenario: Statusstrip op telefoon
- **WHEN** de statusstrip op 375px breed wordt getoond
- **THEN** zijn alle zes statussen bereikbaar (horizontaal scrollbaar binnen de strip of wrappend) en blijft de actieve status zichtbaar

#### Scenario: Zoekveld op telefoon
- **WHEN** de zoekbalk op 375px breed wordt getoond
- **THEN** vult het zoekveld de beschikbare breedte en staat de checkbox "Inclusief gearchiveerd" op een eigen rij of wrapt netjes

### Requirement: Touch-targets
Interactieve elementen (knoppen, links in navigatie, favoriet-knop, filterpills, statusselects, checkboxes) SHALL op touch-apparaten een raakvlak van minstens 44×44px hebben.

#### Scenario: Favoriet-knop op touch
- **WHEN** de favoriet-knop op een apparaat met `pointer: coarse` wordt gerenderd
- **THEN** is het raakvlak minstens 44×44px

### Requirement: Acties niet afhankelijk van hover
Acties die op desktop pas bij hover verschijnen (zoals "Solliciteer") MUST op apparaten zonder hover permanent zichtbaar zijn.

#### Scenario: Solliciteer-knop op touch
- **WHEN** een vacature zonder sollicitatie op een apparaat met `hover: none` wordt getoond
- **THEN** is de solliciteer-actie zichtbaar zonder hover

### Requirement: Dynamische viewporthoogte
De app-shell en de loginpagina SHALL de dynamische viewporthoogte (`dvh`) gebruiken zodat de mobiele browserbalk geen inhoud afknipt.

#### Scenario: Inhoud onderaan bereikbaar
- **WHEN** de gebruiker op een telefoon naar het einde van de vacaturelijst scrolt
- **THEN** is de laatste rij/kaart volledig zichtbaar boven de onderrand van het scherm

### Requirement: Detail- en loginpagina schalen mee
De detailpagina van een vacature en de loginpagina SHALL hun padding en typografie op smalle schermen verkleinen en actieknoppen stapelen indien ze niet naast elkaar passen.

#### Scenario: Vacaturedetail op telefoon
- **WHEN** een vacaturedetail op 375px breed wordt geopend
- **THEN** past de inhoud binnen de viewport en zijn alle acties bereikbaar
