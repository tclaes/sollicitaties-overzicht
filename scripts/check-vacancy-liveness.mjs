#!/usr/bin/env node
/**
 * Liveness-check voor actieve vacatures in data/firestore-sync-input.json.
 *
 * Haalt de url van elk actief item op en geeft per item één uitkomst:
 *   levend             publieke bron, pagina bestaat en toont de vacature
 *   verlopen-kandidaat 404/410 of een "niet meer beschikbaar"-melding
 *   onbekend           login-bronnen (LinkedIn, Indeed, ...), bot-controles, redirects,
 *                      netwerkfouten en pagina's die de vacature niet tonen (bv. SPA-shell)
 *
 * "onbekend" is nooit "levend": zonder bewijs blijft een item aan de browsercontrole van de
 * scan overgelaten. Dit script zet NOOIT verlopen: true; een soft-404 of tijdelijke fout mag
 * geen Firestore-document laten verwijderen. Met --write wordt enkel gecontroleerdOp = vandaag
 * gezet bij "levend"-items.
 *
 * Gebruik:
 *   node scripts/check-vacancy-liveness.mjs [input.json] [--json] [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeTitel, normalizeUrl } from "./vacancy-keys.mjs";

// Bronnen achter een login of bot-detectie: niet zonder meer te controleren.
const LOGIN_HOSTS = ["linkedin.com", "indeed.com", "stepstone.be", "glassdoor.com", "facebook.com"];

// Teksten (zonder accenten, lowercase) waarmee een pagina meldt dat de vacature weg is.
export const GONE_MARKERS = [
  "niet meer beschikbaar",
  "niet langer beschikbaar",
  "niet meer gepubliceerd",
  "niet meer online",
  "vacature is verlopen",
  "vacature is gesloten",
  "vacature bestaat niet",
  "er kan niet meer worden gesolliciteerd",
  "no longer available",
  "no longer accepting applications",
  "position has been filled",
  "job has expired",
  "this job is no longer",
  "page not found",
  "pagina niet gevonden",
];

// Pagina's van een bot-controle: zegt niets over de vacature.
const CHALLENGE_MARKERS = ["just a moment", "verify you are human", "attention required", "enable javascript and cookies"];

const USER_AGENT = "Mozilla/5.0 (compatible; SollicitatiesApp-livenesscheck/1.0)";

function plain(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Zichtbare tekst van een pagina: scripts, styles en noscript (waar SPA's hun meldingsteksten en
// state in bewaren, bv. VDAB: "het evenement is niet meer beschikbaar") tellen niet mee.
export function visibleText(html) {
  return plain(
    html
      .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
  );
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isLoginHost(url) {
  const host = hostOf(url);
  return LOGIN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

// De pagina moet de vacature ook echt tonen: een SPA-shell geeft 200 voor een dode vacature.
function showsVacancy(bodyPlain, titel) {
  const tokens = normalizeTitel(titel, "")
    .split(/[^a-z0-9.#+]+/)
    .filter((w) => w.length >= 3);
  if (!tokens.length) return false;
  // Zelfde herleiding als de titel, zodat "full stack" op de pagina "fullstack" in de titel vindt.
  const body = normalizeTitel(bodyPlain, "");
  const found = tokens.filter((w) => body.includes(w)).length;
  return found / tokens.length >= 0.6;
}

/**
 * @param {{ url: string, titel?: string, status?: number, finalUrl?: string, body?: string, error?: unknown }} r
 * @returns {{ uitkomst: "levend" | "verlopen-kandidaat" | "onbekend", reden: string }}
 */
export function classifyResponse(r) {
  if (isLoginHost(r.url)) return { uitkomst: "onbekend", reden: "bron achter login" };
  if (r.error) return { uitkomst: "onbekend", reden: `ophalen mislukt: ${r.error instanceof Error ? r.error.message : "onbekende fout"}` };
  if (r.status === 404 || r.status === 410) return { uitkomst: "verlopen-kandidaat", reden: `HTTP ${r.status}` };
  if (r.status === undefined || r.status < 200 || r.status >= 300) {
    return { uitkomst: "onbekend", reden: `HTTP ${r.status ?? "?"}` };
  }
  if (r.finalUrl && isLoginHost(r.finalUrl)) return { uitkomst: "onbekend", reden: "doorgestuurd naar login" };
  if (r.finalUrl && normalizeUrl(r.finalUrl) !== normalizeUrl(r.url)) {
    return { uitkomst: "onbekend", reden: `doorgestuurd naar ${r.finalUrl}` };
  }
  const body = visibleText(r.body ?? "");
  if (CHALLENGE_MARKERS.some((m) => body.includes(m))) return { uitkomst: "onbekend", reden: "bot-controle" };
  const marker = GONE_MARKERS.find((m) => body.includes(m));
  if (marker) return { uitkomst: "verlopen-kandidaat", reden: `pagina meldt "${marker}"` };
  if (!showsVacancy(body, r.titel ?? "")) return { uitkomst: "onbekend", reden: "pagina toont de vacature niet (titel niet gevonden)" };
  return { uitkomst: "levend", reden: "pagina toont de vacature" };
}

async function fetchPage(url, fetchFn, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": USER_AGENT, "accept-language": "nl-BE,nl;q=0.9,en;q=0.5" },
    });
    return { status: res.status, finalUrl: res.url || url, body: res.status >= 200 && res.status < 300 ? await res.text() : "" };
  } catch (error) {
    return { error: controller.signal.aborted ? new Error(`time-out na ${timeoutMs} ms`) : error };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {Record<string, any>[]} items inhoud van de sync-input
 * @param {{ fetchFn?: typeof fetch, concurrency?: number, timeoutMs?: number }} [options]
 */
export async function checkLiveness(items, { fetchFn = fetch, concurrency = 5, timeoutMs = 10_000 } = {}) {
  const actief = items
    .map((v, index) => ({ v, index }))
    .filter(({ v }) => v && v.verlopen !== true && v.nietInteressant !== true && typeof v.url === "string" && v.url);
  const results = [];
  let next = 0;
  async function worker() {
    while (next < actief.length) {
      const i = next++;
      const { v, index } = actief[i];
      const page = isLoginHost(v.url) ? {} : await fetchPage(v.url, fetchFn, timeoutMs);
      results[i] = { index, url: v.url, titel: v.titel, bedrijf: v.bedrijf, ...classifyResponse({ url: v.url, titel: v.titel, ...page }) };
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, actief.length) }, worker));
  return results;
}

/** Zet gecontroleerdOp = vandaag bij "levend"-items. Raakt verlopen/nietInteressant nooit aan. */
export function applyChecked(items, results, today = new Date().toISOString().slice(0, 10)) {
  const levend = new Set(results.filter((r) => r.uitkomst === "levend").map((r) => r.index));
  return items.map((v, index) => (levend.has(index) ? { ...v, gecontroleerdOp: today } : v));
}

async function main() {
  // vp run <script> -- <args> geeft de letterlijke "--" door; filter die weg.
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const json = args.includes("--json");
  const write = args.includes("--write");
  const path = resolve(args.find((a) => !a.startsWith("--")) ?? "data/firestore-sync-input.json");
  const items = JSON.parse(readFileSync(path, "utf8"));

  const results = await checkLiveness(items);
  if (write) writeFileSync(path, `${JSON.stringify(applyChecked(items, results), null, 2)}\n`);

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  const tel = (u) => results.filter((r) => r.uitkomst === u).length;
  for (const r of results.filter((r) => r.uitkomst === "verlopen-kandidaat")) {
    console.log(`VERLOPEN? #${r.index} ${r.bedrijf} / ${r.titel} (${r.url}) - ${r.reden}`);
  }
  console.log(
    `\n${results.length} actieve items: ${tel("levend")} levend, ${tel("verlopen-kandidaat")} verlopen-kandidaat, ${tel("onbekend")} onbekend.` +
      (write ? ` gecontroleerdOp gezet bij ${tel("levend")} items.` : "")
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
