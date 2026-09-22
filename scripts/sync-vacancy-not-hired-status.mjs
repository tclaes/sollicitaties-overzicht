#!/usr/bin/env node
/**
 * Eenmalige data-fix (23-09-2026): `archiveVacancy()` in app/lib/vacancies.ts
 * zette voorheen enkel `isArchived: true` wanneer een sollicitatie op "niet
 * aangeworven" werd gezet, zonder de vacature's eigen `status`-veld mee te
 * synchroniseren. Daardoor bleven zulke vacatures voor altijd op status
 * "gesolliciteerd" staan en telde de "Niet aangeworven"-teller op het
 * overzicht 0, ook al stonden er wel degelijk sollicitaties op die status.
 *
 * Dit script zoekt vacature-documenten die via een sollicitatie met status
 * "niet_aangeworven" gekoppeld zijn (op `vacatureId`), maar zelf nog niet
 * status "niet-aangeworven" hebben, en werkt ze bij: status
 * "niet-aangeworven", isArchived true, plus archiefReden/gearchiveerdOp als
 * die nog ontbreken (zonder een al ingevulde archiefReden te overschrijven).
 *
 * Veiligheid: standaard DRY-RUN (toont enkel het plan, schrijft niets). Pas
 * met de vlag --apply worden de writes echt uitgevoerd.
 *
 * Gebruik:
 *   node scripts/sync-vacancy-not-hired-status.mjs [service-account.json] [--apply]
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SERVICE_ACCOUNT_PATH = join(__dirname, "..", "secrets", "firebase-service-account.json");

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

const notHiredApplications = await db
  .collection("sollicitaties")
  .where("status", "==", "niet_aangeworven")
  .get();

const vacancyIds = [
  ...new Set(
    notHiredApplications.docs
      .map((d) => d.data().vacatureId)
      .filter((id) => typeof id === "string" && id.length > 0)
  ),
];

console.log(
  `${notHiredApplications.size} sollicitatie(s) met status 'niet_aangeworven', ` +
    `${vacancyIds.length} met een vacatureId.`
);
console.log("");

let toFix = 0;
let alreadyOk = 0;
let missing = 0;

for (const id of vacancyIds) {
  const ref = db.collection("vacatures").doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    console.log(`  ${id}: vacature-document bestaat niet (meer) - niets te doen.`);
    missing++;
    continue;
  }

  const data = snap.data();
  if (data.status === "niet-aangeworven") {
    console.log(`  ${id}: status staat al goed ('niet-aangeworven') - overgeslagen.`);
    alreadyOk++;
    continue;
  }

  console.log(`  ${id}: status '${data.status}' -> 'niet-aangeworven' (${data.bedrijf} - ${data.titel})`);
  toFix++;

  if (apply) {
    await ref.set(
      {
        status: "niet-aangeworven",
        isArchived: true,
        ...(data.archiefReden ? {} : { archiefReden: "Niet aangenomen na sollicitatie" }),
        ...(data.gearchiveerdOp ? {} : { gearchiveerdOp: new Date().toISOString() }),
      },
      { merge: true }
    );
  }
}

console.log("");
if (apply) {
  console.log(`Klaar - ${toFix} vacature(s) bijgewerkt, ${alreadyOk} al goed, ${missing} niet gevonden.`);
} else {
  console.log(`Dry-run klaar. Niets geschreven. Voer opnieuw uit met --apply om dit plan echt uit te voeren:`);
  console.log(`  node scripts/sync-vacancy-not-hired-status.mjs --apply`);
}
