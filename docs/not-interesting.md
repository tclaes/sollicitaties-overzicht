## Niet-interessante vacatures

In de app kan Tom een vacature archiveren als "niet interessant" (detailpagina →
knop *Niet interessant* + reden). Dat zet op het Firestore-doc `isArchived: true`,
`status: "niet-interessant"`, `archiveReason` en `dateArchived`. In het overzicht
zijn die verborgen tenzij de filter *Niet interessant* actief is.

De sync-input kent hiervoor de flag `nietInteressant: true` (analoog aan
`verlopen: true`): zo'n item wordt in Firestore gemerged met `isArchived` +
`status: "niet-interessant"` (+ optioneel `archiveReason`), zonder het doc te
verwijderen. De dagelijkse scan gebruikt deze flag én leest Firestore rechtstreeks
om gearchiveerde vacatures niet opnieuw voor te stellen.
