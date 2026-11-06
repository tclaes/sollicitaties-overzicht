# Spec Delta

## Purpose

Waarborgt dat de vacaturedata (sync-input en Firestore) geen duplicaten bevat, dat gearchiveerde vacatures niet via een andere bron terugkomen en dat actieve vacatures recent als nog bestaand zijn gecontroleerd.

## ADDED Requirements

### Requirement: Geen duplicaten op url of document-id
De sync-input MUST elke vacature maar één keer bevatten. Twee items met dezelfde genormaliseerde url, of met hetzelfde document-id (expliciet `id` of afgeleid van de url), SHALL als fout worden gerapporteerd.

#### Scenario: Zelfde url met andere queryparameters
- **GIVEN** twee items met url `https://example.com/jobs/1?utm=a` en `https://example.com/jobs/1/`
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt een fout gerapporteerd die beide items noemt en is het resultaat "mislukt"

#### Scenario: Indeed-vacatures met verschillende jk
- **GIVEN** twee Indeed-items `viewjob?jk=aaa` en `viewjob?jk=bbb`
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt geen duplicaat gerapporteerd

### Requirement: Geen dezelfde vacature via meerdere bronnen
Twee actieve items met dezelfde `sameJobKey` (genormaliseerde titel, bedrijf en locatie-kern) MUST als fout worden gerapporteerd. De tweede bron SHALL als `extraBronnen`-entry op het eerste item staan.

#### Scenario: Dezelfde vacature op twee jobsites
- **GIVEN** een actief item "Full Stack Developer (.net / Angular)", "onbekend (via Kingfisher Recruitment)", locatie "Berchem (Antwerpen)" met een kingfisher-url, en een tweede actief item met dezelfde titel, bedrijf en locatie met een vdab-url
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt een fout gerapporteerd die beide urls en de aanwijzing "zet de tweede url in extraBronnen" bevat

#### Scenario: Schrijfwijze van full-stack verschilt
- **GIVEN** twee actieve items "Fullstack .NET developer" en "Full-Stack .NET Developer (m/v/x)" bij hetzelfde bedrijf en dezelfde locatie
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt een fout gerapporteerd omdat beide dezelfde vacature zijn

#### Scenario: Ander rolniveau bij hetzelfde bedrijf
- **GIVEN** twee actieve items "Lead Front-End Developer" en "Front-end Developer" bij hetzelfde bedrijf en dezelfde locatie
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt geen duplicaat gerapporteerd

#### Scenario: Zelfde titel en bedrijf, andere locatie
- **GIVEN** twee actieve items met dezelfde titel en bedrijf maar locaties "Mechelen" en "Gent"
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt een waarschuwing gerapporteerd en blijft het resultaat "geslaagd"

### Requirement: Gearchiveerde vacatures komen niet terug
Een actief item MUST NOT dezelfde genormaliseerde url of `sameJobKey` hebben als een item met `nietInteressant: true`. Ook een url uit `extraBronnen` van een niet-interessant item telt als dezelfde vacature.

#### Scenario: Niet-interessante vacature duikt op via andere bron
- **GIVEN** een item met `nietInteressant: true` voor "Lead Front-End Developer", CraftCode, Edegem op codejobs.be
- **WHEN** een actief item met dezelfde titel, bedrijf en locatie op it-jobs.be wordt toegevoegd
- **THEN** wordt een fout gerapporteerd dat deze vacature al als niet-interessant is gearchiveerd

#### Scenario: Gearchiveerd met andere schrijfwijze van de titel
- **GIVEN** een item met `nietInteressant: true` voor "Full-stack developer (.NET / Angular)", locatie "Antwerpen", via vdab.be
- **WHEN** een actief item "Full Stack Developer (.NET / Angular)", locatie "Antwerpen (Centrum)", via de site van de recruiter wordt toegevoegd
- **THEN** wordt een fout gerapporteerd dat deze vacature al als niet-interessant is gearchiveerd

#### Scenario: Verlopen item blokkeert niets
- **GIVEN** een item met `verlopen: true` en dezelfde `sameJobKey` als een actief item
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt geen fout gerapporteerd

### Requirement: Controle vóór automatische merge
Een PR die enkel `data/firestore-sync-input.json` wijzigt MUST alleen automatisch worden gemerged als alle foutcontroles in deze capability slagen. Waarschuwingen blokkeren de merge niet.

#### Scenario: Duplicaat blokkeert de auto-merge
- **GIVEN** een PR die enkel de sync-input wijzigt en een duplicaat op `sameJobKey` bevat
- **WHEN** de auto-merge-workflow draait
- **THEN** wordt de PR niet gemerged en toont de workflow de gevonden duplicaten

#### Scenario: Geldige PR wordt gemerged
- **GIVEN** een PR die enkel de sync-input wijzigt, zonder fouten of met enkel waarschuwingen
- **WHEN** de auto-merge-workflow draait
- **THEN** wordt de PR automatisch gemerged

### Requirement: Recente liveness-controle per actieve vacature
Elk actief item MUST een `gecontroleerdOp`-datum (YYYY-MM-DD) hebben die niet in de toekomst ligt en hoogstens 14 dagen vóór de controledatum. Een item dat ouder is of de datum mist, SHALL als fout worden gerapporteerd.

#### Scenario: Item recent gecontroleerd
- **GIVEN** een actief item met `gecontroleerdOp` van 3 dagen geleden
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt geen fout voor dit item gerapporteerd

#### Scenario: Item te lang niet gecontroleerd
- **GIVEN** een actief item met `gecontroleerdOp` van 20 dagen geleden
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt een fout gerapporteerd die het item en het aantal dagen noemt

#### Scenario: Ontbrekende datum tijdens de invoerperiode
- **GIVEN** een actief item zonder `gecontroleerdOp` en een controledatum vóór de ingestelde invoerdatum van de verplichting
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt een waarschuwing gerapporteerd en blijft het resultaat "geslaagd"

#### Scenario: Verlopen en niet-interessante items zijn uitgezonderd
- **GIVEN** items met `verlopen: true` of `nietInteressant: true` zonder `gecontroleerdOp`
- **WHEN** de sync-input wordt gecontroleerd
- **THEN** wordt geen fout voor die items gerapporteerd

### Requirement: Liveness-check op publieke bronnen
Het systeem SHALL de url van elk actief item kunnen controleren bij bronnen die zonder login bereikbaar zijn. Een 404 of 410, of een pagina met een bekende "niet meer beschikbaar"-melding, MUST het item als kandidaat-`verlopen` rapporteren. Bronnen die niet zonder login bereikbaar zijn, SHALL als "onbekend" worden gerapporteerd en nooit als "levend".

#### Scenario: Pagina bestaat niet meer
- **GIVEN** een actief item met een vdab-url die HTTP 404 teruggeeft
- **WHEN** de liveness-check draait
- **THEN** wordt het item gerapporteerd als kandidaat-`verlopen`

#### Scenario: Pagina meldt dat de vacature gesloten is
- **GIVEN** een actief item waarvan de pagina "Deze vacature is niet meer gepubliceerd" bevat
- **WHEN** de liveness-check draait
- **THEN** wordt het item gerapporteerd als kandidaat-`verlopen`

#### Scenario: Bron achter login
- **GIVEN** een actief item met een linkedin-url
- **WHEN** de liveness-check draait
- **THEN** wordt het item als "onbekend" gerapporteerd en niet als kandidaat-`verlopen`, en wordt `gecontroleerdOp` niet aangepast

#### Scenario: Netwerkfout is geen bewijs van verlopen
- **GIVEN** een actief item waarvan het ophalen faalt met een time-out
- **WHEN** de liveness-check draait
- **THEN** wordt het item als "onbekend" gerapporteerd en niet als kandidaat-`verlopen`

### Requirement: Duplicaten in Firestore zijn zichtbaar
Na elke sync naar Firestore SHALL een duplicaatcheck draaien op de collectie `vacatures`. Blijven er duplicaatgroepen over, dan MUST de workflow zichtbaar falen, zonder documenten te verwijderen tenzij de dedupe expliciet met `--apply` is gevraagd.

#### Scenario: Duplicaat blijft over na sync
- **GIVEN** twee documenten in `vacatures` met dezelfde `sameJobKey`
- **WHEN** de post-sync duplicaatcheck draait zonder `--apply`
- **THEN** faalt de workflow, worden de groepen gelogd en wordt geen document gewijzigd of verwijderd

#### Scenario: Geen duplicaten
- **GIVEN** een `vacatures`-collectie zonder duplicaatgroepen
- **WHEN** de post-sync duplicaatcheck draait
- **THEN** slaagt de workflow
