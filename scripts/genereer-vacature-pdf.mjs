#!/usr/bin/env node
/**
 * Genereert een overzicht-PDF van de actieve vacatures uit data/firestore-sync-input.json.
 *
 * Gebruik:
 *   node scripts/genereer-vacature-pdf.mjs [--input <pad>] [--out <map>] [--date <DD_MM_YYYY>]
 *
 * Standaard:
 *   --input  data/firestore-sync-input.json
 *   --out    ~/Library/CloudStorage/OneDrive-Personal/Werk/Vacatures zoeken
 *   --date   vandaag
 *
 * Rendert via headless Google Chrome (geen npm-dependency). Schrijft
 *   <out>/vacatures_actief_overzicht_<date>.pdf
 * en print dat pad op stdout. Draait lokaal op Tom's Mac; in CI heeft het geen zin.
 *
 * Verlopen vacatures (verlopen: true) komen niet in de PDF.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
function opt(naam, standaard) {
  const i = args.indexOf(`--${naam}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : standaard;
}

const nu = new Date();
const dd = String(nu.getDate()).padStart(2, "0");
const mm = String(nu.getMonth() + 1).padStart(2, "0");
const jjjj = nu.getFullYear();
const datum = opt("date", `${dd}_${mm}_${jjjj}`);
const peildatum = `${jjjj}-${mm}-${dd}`;

const inputPad = opt("input", "data/firestore-sync-input.json");
const outMap = opt(
  "out",
  join(homedir(), "Library", "CloudStorage", "OneDrive-Personal", "Werk", "Vacatures zoeken"),
);

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!existsSync(inputPad)) {
  console.error(`Input niet gevonden: ${inputPad}`);
  process.exit(1);
}
if (!existsSync(CHROME)) {
  console.error(
    `Google Chrome niet gevonden op ${CHROME}. Zet CHROME_PATH of installeer Chrome.`,
  );
  process.exit(1);
}

const alle = JSON.parse(readFileSync(inputPad, "utf8"));
const actief = alle.filter((v) => v.verlopen !== true);

const REGIO_LABEL = {
  limburg: "Limburg",
  antwerpen: "Antwerpen",
  brussel: "Brussel",
  vlaanderen: "Vlaanderen",
  remote: "Remote",
  andere: "Andere",
};
const REGIO_VOLGORDE = ["limburg", "antwerpen", "vlaanderen", "brussel", "remote", "andere"];

const perRegio = new Map();
for (const v of actief) {
  const r = REGIO_VOLGORDE.includes(v.regio) ? v.regio : "andere";
  if (!perRegio.has(r)) perRegio.set(r, []);
  perRegio.get(r).push(v);
}
for (const lijst of perRegio.values()) {
  lijst.sort((a, b) => (a.bedrijf || "").localeCompare(b.bedrijf || "", "nl"));
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const FUNCTIE_LABEL = { frontend: "frontend", fullstack: "full stack" };

function rij(v) {
  const tags = (v.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join(" ");
  const functie = v.functie
    ? `<span class="functiebadge functie-${esc(v.functie)}">${esc(FUNCTIE_LABEL[v.functie] || v.functie)}</span>`
    : "";
  const url = v.url
    ? `<a href="${esc(v.url)}">${esc(v.url.replace(/^https?:\/\//, ""))}</a>`
    : "<span class=\"muted\">geen url</span>";
  return `<tr>
    <td><div class="functie">${esc(v.titel)}${functie}</div><div class="bedrijf">${esc(v.bedrijf)}</div></td>
    <td>${esc(v.locatie)}</td>
    <td><div class="besch">${esc(v.beschrijving)}</div><div class="tags">${tags}</div></td>
    <td class="url">${url}</td>
  </tr>`;
}

const secties = REGIO_VOLGORDE.filter((r) => perRegio.has(r))
  .map((r) => {
    const lijst = perRegio.get(r);
    return `<h2>${REGIO_LABEL[r]} <span class="aantal">${lijst.length}</span></h2>
    <table>
      <thead><tr><th>Functie / bedrijf</th><th>Locatie</th><th>Omschrijving</th><th>Link</th></tr></thead>
      <tbody>${lijst.map(rij).join("\n")}</tbody>
    </table>`;
  })
  .join("\n");

const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font: 10.5px/1.45 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; }
  h1 { font-size: 19px; margin: 0 0 2px; }
  .peil { color: #666; font-size: 10px; margin-bottom: 16px; }
  h2 { font-size: 13px; margin: 18px 0 6px; border-bottom: 2px solid #0a5f55; padding-bottom: 3px; color: #0a5f55; }
  h2 .aantal { color: #999; font-weight: 400; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th { text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: .04em; color: #888; border-bottom: 1px solid #ccc; padding: 4px 6px; }
  td { padding: 6px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr { break-inside: avoid; }
  .functie { font-weight: 600; }
  .functiebadge { display: inline-block; margin-left: 5px; font-weight: 500; font-size: 8px; border-radius: 3px; padding: 0 4px; vertical-align: middle; }
  .functie-frontend { background: #e0edfb; color: #1d4ed8; }
  .functie-fullstack { background: #f3e8ff; color: #7e22ce; }
  .bedrijf { color: #555; }
  .besch { max-width: 260px; }
  .tags { margin-top: 3px; }
  .tag { display: inline-block; background: #eef4f2; color: #0a5f55; border-radius: 3px; padding: 0 4px; font-size: 8.5px; margin: 1px 2px 0 0; }
  td.url { font-size: 8.5px; word-break: break-all; max-width: 150px; }
  a { color: #0a5f55; text-decoration: none; }
  .muted { color: #aaa; }
  footer { margin-top: 20px; color: #999; font-size: 8.5px; }
</style></head><body>
  <h1>Actief vacature-overzicht — Frontend &amp; Full-stack Developer</h1>
  <div class="peil">Peildatum ${peildatum} · ${actief.length} actieve vacatures · regio Limburg + Leuven/Mechelen/Antwerpen/Kempen</div>
  ${secties || "<p>Geen actieve vacatures.</p>"}
  <footer>Automatisch gegenereerd uit data/firestore-sync-input.json door de dagelijkse vacaturescan.</footer>
</body></html>`;

mkdirSync(outMap, { recursive: true });
const pdfPad = join(outMap, `vacatures_actief_overzicht_${datum}.pdf`);

const werkmap = join(tmpdir(), `vacature-pdf-${process.pid}`);
mkdirSync(werkmap, { recursive: true });
const htmlPad = join(werkmap, "overzicht.html");
writeFileSync(htmlPad, html, "utf8");

try {
  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPad}`,
      `file://${htmlPad}`,
    ],
    { stdio: "ignore", timeout: 60_000 },
  );
} finally {
  rmSync(werkmap, { recursive: true, force: true });
}

if (!existsSync(pdfPad)) {
  console.error("Chrome heeft geen PDF geschreven.");
  process.exit(1);
}
console.log(pdfPad);
