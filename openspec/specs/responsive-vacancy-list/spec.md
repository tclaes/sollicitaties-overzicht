# responsive-vacancy-list Specification

## Purpose

Definieert hoe de vacaturelijst en sollicitatielijst zich aanpassen per schermgrootte, met behoud van alle acties en infinite scroll.

## Requirements

### Requirement: Tabel op desktop, kaarten op kleinere schermen
De vacaturelijst SHALL op desktop (≥ 1024px) als tabel en op telefoon en tablet (< 1024px) als kaartenlijst worden getoond.

#### Scenario: Desktop
- **WHEN** de vacaturelijst op 1280px breed wordt getoond
- **THEN** is een tabel met kolommen Status, Bron, Functie, Tags, Locatie en Match zichtbaar en zijn er geen kaarten

#### Scenario: Telefoon
- **WHEN** de vacaturelijst op 375px breed wordt getoond
- **THEN** is elke vacature een kaart en is er geen tabel zichtbaar

### Requirement: Inhoud van de vacaturekaart
Elke kaart MUST titel, functie-badge (indien `function` gezet), bedrijf, status, locatie en matchlabel tonen, plus maximaal 3 tags, de favoriet-knop en de bron.

#### Scenario: Kaart met alle velden
- **GIVEN** een vacature met `function: "fullstack"`, `match.score: "strong"` en 3 tags
- **WHEN** de kaart wordt gerenderd
- **THEN** toont ze titel, "Fullstack"-badge, bedrijf, status, locatie, matchlabel en de 3 tags

#### Scenario: Kaart zonder match
- **WHEN** een vacature geen `match` heeft
- **THEN** toont de kaart geen matchlabel en blijft de layout intact

### Requirement: Acties op de kaart
De kaart SHALL dezelfde acties bieden als de tabelrij: navigeren naar de detailpagina, favoriet togglen, solliciteren en sollicitatiestatus wijzigen.

#### Scenario: Kaart openen
- **WHEN** de gebruiker op de kaart (buiten de actieknoppen) tikt
- **THEN** navigeert de app naar `/vacatures/<id>`

#### Scenario: Favoriet togglen zonder navigatie
- **WHEN** de gebruiker op de favoriet-knop van een kaart tikt
- **THEN** wordt de favoriet-status gewijzigd en navigeert de app niet

#### Scenario: Solliciteren vanaf kaart
- **WHEN** de gebruiker op een kaart zonder sollicitatie de solliciteer-actie kiest en bevestigt
- **THEN** wordt een sollicitatie aangemaakt en toont de kaart de status "gesolliciteerd" met datum

### Requirement: Infinite scroll en lege toestand blijven werken
De kaartenlijst MUST hetzelfde laad- en scrollgedrag hebben als de tabel (chunks, sentinel, voetregel) en dezelfde lege-toestandtekst tonen.

#### Scenario: Meer kaarten laden
- **WHEN** de gebruiker op een telefoon naar het einde van de geladen kaarten scrolt en er meer resultaten zijn
- **THEN** worden de volgende kaarten geladen

#### Scenario: Geen resultaten
- **WHEN** de filters geen vacatures opleveren
- **THEN** toont de lijst "Geen vacatures gevonden."

### Requirement: Sollicitatielijst op smalle schermen
De sollicitatielijst SHALL op telefoon als kaartenlijst (datum, bedrijf, functie, status-select) worden getoond zodat bedrijf en functie niet worden afgekapt tot onleesbaar.

#### Scenario: Status wijzigen op telefoon
- **WHEN** de gebruiker op 375px breed de status-select van een sollicitatie wijzigt
- **THEN** wordt de nieuwe status opgeslagen zoals op desktop
