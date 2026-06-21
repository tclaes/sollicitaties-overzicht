import { readFileSync } from "fs";
import { homedir } from "os";

const config = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, "utf8"));
const token = config.tokens.access_token;
const PROJECT = "sollicitaties-app";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const sollicitaties = [
  { id: "kpd-2026-04-16", bedrijf: "KPD", rol: "Frontend Developer", gesolliceerdOp: "2026-04-16", status: "geen_reactie", notitie: "CV + motivatiebrief verstuurd" },
  { id: "acagroup-2026-04-17", bedrijf: "ACA Group", rol: "Frontend Developer", gesolliceerdOp: "2026-04-17", status: "geen_reactie", notitie: "CV + motivatiebrief verstuurd" },
  { id: "climapulse-2026-05-01", bedrijf: "Climapulse", rol: "Senior Frontend Developer", gesolliceerdOp: "2026-05-01", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 10-06-2026" },
  { id: "appeel-2026-05-28", bedrijf: "Appeel", rol: "Frontend Developer", gesolliceerdOp: "2026-05-28", status: "geen_reactie" },
  { id: "micro1-2026-05-31", bedrijf: "Micro1", rol: "Frontend Developer", gesolliceerdOp: "2026-05-31", status: "geen_reactie" },
  { id: "xplore-frontend-2026-06-02", bedrijf: "Xplore Group", rol: "Front-end Developer", gesolliceerdOp: "2026-06-02", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 20-06-2026" },
  { id: "xplore-martech-2026-06-02", bedrijf: "Xplore Group", rol: "Technical Martech Developer", gesolliceerdOp: "2026-06-02", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 20-06-2026" },
  { id: "xplore-webdev-2026-06-02", bedrijf: "Xplore Group", rol: "Web Developers", gesolliceerdOp: "2026-06-02", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 20-06-2026" },
  { id: "imengine-2026-06-08", bedrijf: "Imengine", rol: "Angular Developer", gesolliceerdOp: "2026-06-08", status: "gesolliciteerd" },
  { id: "alpine-digital-2026-06-11", bedrijf: "Alpine Digital", rol: "Full-stack Developer", gesolliceerdOp: "2026-06-11", status: "niet_wervend", notitie: "Bedrijf zoekt voorlopig niemand voor deze rol" },
  { id: "vanroey-2026-06-20", bedrijf: "VanRoey", rol: "Front-End / Full-Stack Developer", gesolliceerdOp: "2026-06-20", status: "gesolliciteerd", notitie: "The Collective" },
];

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    fields[k] = { stringValue: String(v) };
  }
  return fields;
}

let ok = 0;
for (const { id, ...data } of sollicitaties) {
  const res = await fetch(`${BASE}/sollicitaties/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (res.ok) { ok++; process.stdout.write("."); }
  else { console.error(`\nFout bij ${id}:`, await res.text()); }
}
console.log(`\n✓ ${ok}/${sollicitaties.length} sollicitaties geïmporteerd`);
