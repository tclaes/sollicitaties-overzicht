#!/usr/bin/env node
/**
 * Merge-gate voor data/firestore-sync-input.json: controleert vóór de sync of de input
 * geen duplicaten bevat, geen vacature die al als niet-interessant is gearchiveerd opnieuw
 * actief maakt, en of actieve items recent op hun bestaan zijn gecontroleerd.
 *
 * Draait zonder dependencies (enkel Node en ./vacancy-keys.mjs), zodat de auto-merge-workflow
 * hem kan gebruiken zonder `vp install`.
 *
 * Gebruik:
 *   node scripts/check-sync-input.mjs [input.json] [--json]
 *
 * Exitcode 1 bij fouten; waarschuwingen blokkeren niet. Zie
 * openspec/specs/vacancy-data-integrity voor het gedrag.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { documentId, locatieKern, normalizeBedrijf, normalizeTitel, normalizeUrl, sameJobKey } from "./vacancy-keys.mjs";

export const MAX_AGE_DAYS = 14;

// Vanaf deze datum is een ontbrekende `gecontroleerdOp` een fout i.p.v. een waarschuwing.
// Gekozen als invoerdatum (2026-11-06) + 14 dagen, zodat de scan eerst alle items kan bijwerken.
export const GECONTROLEERD_VERPLICHT_VANAF = "2026-11-20";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dayNumber(iso) {
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) ? null : Math.floor(t / DAY_MS);
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim() !== "";
}

function label(e) {
  return `#${e.index} ${e.v.bedrijf ?? "?"} / ${e.v.titel ?? "?"} / ${e.v.locatie ?? "?"} (${e.v.url ?? "geen url"})`;
}

function urlsOf(v) {
  const urls = [v.url, ...(Array.isArray(v.extraBronnen) ? v.extraBronnen.map((b) => b?.url) : [])];
  return urls.filter(isNonEmptyString).map(normalizeUrl).filter(Boolean);
}

function group(entries, keyFn) {
  const map = new Map();
  for (const e of entries) {
    const key = keyFn(e);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  return [...map.entries()].filter(([, list]) => list.length > 1);
}

/**
 * @param {unknown} items inhoud van data/firestore-sync-input.json
 * @param {{ today?: string, maxAgeDays?: number, verplichtVanaf?: string }} [options]
 * @returns {{ errors: {code: string, message: string}[], warnings: {code: string, message: string}[], summary: {total: number, actief: number} }}
 */
export function checkSyncInput(
  items,
  { today = todayIso(), maxAgeDays = MAX_AGE_DAYS, verplichtVanaf = GECONTROLEERD_VERPLICHT_VANAF } = {}
) {
  const errors = [];
  const warnings = [];
  const fail = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });

  if (!Array.isArray(items)) {
    fail("vorm", "Verwacht een JSON-array.");
    return { errors, warnings, summary: { total: 0, actief: 0 } };
  }

  // --- Vorm: elk actief item heeft titel, bedrijf en url (de oorspronkelijke merge-gate).
  const entries = [];
  items.forEach((v, index) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      fail("vorm", `Item ${index} is geen object.`);
      return;
    }
    const status = v.verlopen === true ? "verlopen" : v.nietInteressant === true ? "nietInteressant" : "actief";
    const entry = { v, index, status };
    if (status === "actief") {
      const ontbreekt = ["titel", "bedrijf", "url"].filter((veld) => !isNonEmptyString(v[veld]));
      if (ontbreekt.length) {
        fail("vorm", `Item ${index} (${v.bedrijf ?? "?"} / ${v.titel ?? "?"}) mist verplicht veld "${ontbreekt.join('", "')}".`);
        return;
      }
    }
    entries.push(entry);
  });

  const actief = entries.filter((e) => e.status === "actief");
  const archief = entries.filter((e) => e.status === "nietInteressant");
  const reported = new Set(); // "i-j" van paren die al als fout gemeld zijn
  const pairKey = (a, b) => (a.index < b.index ? `${a.index}-${b.index}` : `${b.index}-${a.index}`);
  const markPairs = (list) => {
    for (const a of list) for (const b of list) if (a !== b) reported.add(pairKey(a, b));
  };

  // --- 1. Zelfde document-id of zelfde genormaliseerde url, over alle items heen.
  for (const [id, list] of group(entries, (e) => documentId(e.v))) {
    fail(
      "dubbel-id",
      `Zelfde document-id '${id}': ${list.map(label).join(" en ")}. Houd één item over en zet de andere bron in extraBronnen.`
    );
    markPairs(list);
  }
  for (const [url, list] of group(entries, (e) => (isNonEmptyString(e.v.url) ? normalizeUrl(e.v.url) : null))) {
    if (list.every((a) => list.every((b) => a === b || reported.has(pairKey(a, b))))) continue;
    fail(
      "dubbel-url",
      `Zelfde url '${url}': ${list.map(label).join(" en ")}. Houd één item over en zet de andere bron in extraBronnen.`
    );
    markPairs(list);
  }

  // --- 2. Dezelfde vacature via meerdere bronnen onder de actieve items (sameJobKey).
  for (const [, list] of group(actief, (e) => sameJobKey(e.v))) {
    const allesGescheiden = list.every((e) => isNonEmptyString(e.v.id));
    if (allesGescheiden && new Set(list.map((e) => e.v.id)).size === list.length) continue;
    if (list.every((a) => list.every((b) => a === b || reported.has(pairKey(a, b))))) continue;
    fail(
      "dubbel-vacature",
      `Dezelfde vacature (titel, bedrijf en locatie) staat meerdere keren actief: ${list.map(label).join(" en ")}. ` +
        `Zet de tweede url in extraBronnen van het eerste item, of geef beide items een eigen expliciet \`id\` als het echt verschillende vacatures zijn.`
    );
    markPairs(list);
  }

  // --- 3. Een actief item mag niet dezelfde vacature zijn als een gearchiveerd item (archief wint).
  const archiefByJob = new Map();
  const archiefByUrl = new Map();
  for (const e of archief) {
    const key = sameJobKey(e.v);
    if (key && !archiefByJob.has(key)) archiefByJob.set(key, e);
    for (const url of urlsOf(e.v)) if (!archiefByUrl.has(url)) archiefByUrl.set(url, e);
  }
  for (const e of actief) {
    const twin = archiefByJob.get(sameJobKey(e.v) ?? "") ?? urlsOf(e.v).map((u) => archiefByUrl.get(u)).find(Boolean);
    if (!twin || reported.has(pairKey(e, twin))) continue;
    fail(
      "archief-terug",
      `Deze vacature is al als niet-interessant gearchiveerd: ${label(e)} komt overeen met ${label(twin)}. ` +
        `Zet het actieve item op nietInteressant: true of laat het weg.`
    );
    reported.add(pairKey(e, twin));
  }

  // --- 4. Waarschuwing: zelfde bedrijf + titel, andere locatie.
  const bedrijfTitel = (e) => {
    const bedrijf = normalizeBedrijf(e.v.bedrijf);
    return bedrijf && bedrijf !== "onbekend" ? `${normalizeTitel(e.v.titel, e.v.locatie)}|${bedrijf}` : null;
  };
  for (const [, list] of group(actief, bedrijfTitel)) {
    if (new Set(list.map((e) => locatieKern(e.v.locatie))).size < 2) continue;
    if (list.every((a) => list.every((b) => a === b || reported.has(pairKey(a, b))))) continue;
    warn("zelfde-titel-andere-locatie", `Zelfde bedrijf en titel op verschillende locaties, controleer of dit echt verschillende vacatures zijn: ${list.map(label).join(" en ")}.`);
  }

  // --- 5. Recente liveness-controle per actief item.
  const todayDay = dayNumber(today);
  const verplicht = dayNumber(today) !== null && today >= verplichtVanaf;
  const zonderDatum = [];
  for (const e of actief) {
    const g = e.v.gecontroleerdOp;
    if (g === undefined || g === null) {
      zonderDatum.push(e);
      continue;
    }
    const day = typeof g === "string" && DATE_RE.test(g) ? dayNumber(g) : null;
    if (day === null) {
      fail("gecontroleerd-formaat", `${label(e)}: gecontroleerdOp '${g}' is geen geldige datum (YYYY-MM-DD).`);
    } else if (todayDay !== null && day > todayDay) {
      fail("gecontroleerd-toekomst", `${label(e)}: gecontroleerdOp ${g} ligt in de toekomst.`);
    } else if (todayDay !== null && todayDay - day > maxAgeDays) {
      fail("gecontroleerd-verouderd", `${label(e)}: laatst gecontroleerd op ${g}, ${todayDay - day} dagen geleden (maximaal ${maxAgeDays}).`);
    }
  }
  if (zonderDatum.length) {
    const voorbeeld = zonderDatum.slice(0, 5).map(label).join("; ");
    const meer = zonderDatum.length > 5 ? ` en ${zonderDatum.length - 5} andere` : "";
    const bericht = `${zonderDatum.length} actieve item(s) zonder gecontroleerdOp: ${voorbeeld}${meer}.`;
    if (verplicht) fail("gecontroleerd-ontbreekt", bericht);
    else warn("gecontroleerd-ontbreekt", `${bericht} Wordt een fout vanaf ${verplichtVanaf}.`);
  }

  return { errors, warnings, summary: { total: items.length, actief: actief.length } };
}

function main() {
  // vp run <script> -- <args> geeft de letterlijke "--" door; filter die weg.
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const json = args.includes("--json");
  const path = resolve(args.find((a) => !a.startsWith("--")) ?? "data/firestore-sync-input.json");

  let items;
  try {
    items = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`Kan ${path} niet lezen als JSON: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const result = checkSyncInput(items);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const w of result.warnings) console.warn(`WAARSCHUWING [${w.code}] ${w.message}`);
    for (const e of result.errors) console.error(`FOUT [${e.code}] ${e.message}`);
    const { total, actief } = result.summary;
    console.log(
      result.errors.length
        ? `\n${result.errors.length} fout(en), ${result.warnings.length} waarschuwing(en) in ${total} items (${actief} actief).`
        : `OK — ${total} items (${actief} actief), ${result.warnings.length} waarschuwing(en).`
    );
  }
  process.exit(result.errors.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
