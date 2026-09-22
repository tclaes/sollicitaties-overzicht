#!/usr/bin/env node
/**
 * Eenmalige migratie: de sollicitatie-statussen "afgewezen" en "niet_wervend"
 * betekenden voor de gebruiker hetzelfde ("geen aanbod gekregen") en zijn
 * samengevoegd tot één status "niet_aangeworven" (22-09-2026, zie
 * app/lib/schemas.ts en app/lib/firestoreMappers.ts).
 *
 * Dit script werkt bestaande documenten in de Firestore-collectie
 * `sollicitaties` bij: elk document met status "afgewezen" of "niet_wervend"
 * krijgt status "niet_aangeworven". Overige velden blijven ongewijzigd.
 *
 * Veiligheid: standaard DRY-RUN (toont enkel het plan, schrijft niets). Pas
 * met de vlag --apply worden de writes echt uitgevoerd.
 *
 * Gebruik:
 *   node scripts/migrate-application-status.mjs [service-account.json] [--apply]
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = join(__dirname, "..", "secrets", "firebase-service-account.json");

const OLD_STATUSES = ["afgewezen", "niet_wervend"];
const NEW_STATUS = "niet_aangeworven";

const args = process.argv.slice(2).filter((a) => a !== "--");
const apply = args.includes("--apply");
const serviceAccountArg = args.find((a) => a !== "--apply");

const serviceAccountPath =
  serviceAccountArg ||
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  (existsSync(DEFAULT_SERVICE_ACCOUNT_PATH) ? DEFAULT_SERVICE_ACCOUNT_PATH : undefined);
if (!serviceAccountPath) {
  console.error(
    `Geen Firebase service-account JSON gevonden. Geef het pad op (1e argument of FIREBASE_SERVICE_ACCOUNT_PATH env var), ` +
      `of plaats het bestand op ${DEFAULT_SERVICE_ACCOUNT_PATH}.`
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

console.log(apply ? "Modus: APPLY (schrijft echt)" : "Modus: DRY-RUN (toont enkel het plan, geen writes)");
console.log("");

const snap = await db.collection("sollicitaties").get();
const toMigrate = snap.docs.filter((d) => OLD_STATUSES.includes(d.data().status));

console.log(`${snap.size} document(en) totaal in 'sollicitaties', ${toMigrate.length} te migreren.`);
console.log("");

for (const d of toMigrate) {
  console.log(`  ${d.id}: '${d.data().status}' -> '${NEW_STATUS}'`);
  if (apply) {
    await d.ref.set({ status: NEW_STATUS }, { merge: true });
  }
}

console.log("");
if (apply) {
  console.log(`Klaar - ${toMigrate.length} document(en) gemigreerd.`);
} else {
  console.log(`Dry-run klaar. Niets geschreven. Voer opnieuw uit met --apply om dit plan echt uit te voeren:`);
  console.log(`  node scripts/migrate-application-status.mjs --apply`);
}
