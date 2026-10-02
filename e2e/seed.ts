/**
 * Seeds the Firebase emulators (Auth + Firestore) with fixture data for e2e tests.
 * Only ever talks to the emulator — never touches production Firestore.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "localhost:9099";

// Not a real credential — this account only ever exists in the local/CI
// Firebase Auth *emulator* (see e2e/global-setup.ts), never a real project.
export const TEST_USER = {
  email: "tom.claes82@gmail.com",
  password: process.env.E2E_EMULATOR_PASSWORD || ["e2e", "emulator", "only", "42"].join("-"),
};

export const VACANCY_IDS = {
  new: "vacancy-nieuw",
  viewed: "vacancy-bekeken",
  applied: "vacancy-gesolliciteerd",
  detail: "vacancy-detail-solliciteren",
  archived: "vacancy-gearchiveerd-svelte",
};

export async function seed() {
  const app = initializeApp({ projectId: "demo-test" });
  const auth = getAuth(app);
  const db = getFirestore(app);

  await auth.createUser(TEST_USER).catch(async (err) => {
    if (err.code !== "auth/email-already-exists") throw err;
    const existing = await auth.getUserByEmail(TEST_USER.email);
    await auth.updateUser(existing.uid, { password: TEST_USER.password });
  });

  const vacancies = db.collection("vacatures");
  await Promise.all([
    vacancies.doc(VACANCY_IDS.new).set({
      id: VACANCY_IDS.new,
      titel: "Nieuwe Frontend Rol",
      bedrijf: "Fixture BV",
      locatie: "Hasselt",
      regio: "limburg",
      url: "https://example.com/nieuwe-frontend-rol",
      beschrijving: "Fixture vacature met status nieuw.",
      bron: "andere",
      functie: "frontend",
      gevondenOp: new Date().toISOString(),
      status: "nieuw",
      tags: ["React"],
      match: { score: "sterk", toelichting: "Sterke match voor e2e-fixture." },
    }),
    vacancies.doc(VACANCY_IDS.viewed).set({
      id: VACANCY_IDS.viewed,
      titel: "Bekeken Full Stack Rol",
      bedrijf: "Fixture Full Stack NV",
      locatie: "Antwerpen",
      regio: "antwerpen",
      url: "https://example.com/bekeken-fullstack-rol",
      beschrijving: "Fixture vacature met status bekeken, klaar om te solliciteren.",
      bron: "indeed",
      functie: "fullstack",
      gevondenOp: new Date().toISOString(),
      status: "bekeken",
      tags: ["Node.js", "React"],
    }),
    vacancies.doc(VACANCY_IDS.applied).set({
      id: VACANCY_IDS.applied,
      titel: "Reeds Gesolliciteerd Rol",
      bedrijf: "Fixture Applied Inc",
      locatie: "Leuven",
      regio: "vlaanderen",
      url: "https://example.com/al-gesolliciteerd",
      beschrijving: "Fixture vacature waar al op gesolliciteerd is.",
      bron: "linkedin",
      gevondenOp: new Date().toISOString(),
      status: "gesolliciteerd",
      tags: [],
    }),
    // Eigen vacature voor de detailpagina-test, zodat die niet botst met de
    // parallel draaiende solliciteer-test op de overzichtspagina.
    vacancies.doc(VACANCY_IDS.detail).set({
      id: VACANCY_IDS.detail,
      titel: "Detail Solliciteer Rol",
      bedrijf: "Fixture Detail BV",
      locatie: "Gent",
      regio: "vlaanderen",
      url: "https://example.com/detail-solliciteer-rol",
      beschrijving: "Fixture vacature om vanaf de detailpagina op te solliciteren.",
      bron: "indeed",
      gevondenOp: new Date().toISOString(),
      status: "bekeken",
      tags: [],
    }),
    // Gearchiveerde vacature met een unieke tag voor de zoek-test.
    vacancies.doc(VACANCY_IDS.archived).set({
      id: VACANCY_IDS.archived,
      titel: "Gearchiveerde Svelte Rol",
      bedrijf: "Fixture Archief BV",
      locatie: "Genk",
      regio: "limburg",
      url: "https://example.com/gearchiveerde-svelte-rol",
      beschrijving: "Fixture vacature die al gearchiveerd is.",
      bron: "vdab",
      functie: "frontend",
      gevondenOp: new Date().toISOString(),
      status: "niet-interessant",
      isArchived: true,
      archiefReden: "Fixture",
      tags: ["Svelte"],
    }),
  ]);

  await db.collection("sollicitaties").doc("sollicitatie-fixture-1").set({
    vacatureId: VACANCY_IDS.applied,
    bedrijf: "Fixture Applied Inc",
    rol: "Reeds Gesolliciteerd Rol",
    gesolliceerdOp: "2026-01-15",
    status: "gesolliciteerd",
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("Emulator seed klaar.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
