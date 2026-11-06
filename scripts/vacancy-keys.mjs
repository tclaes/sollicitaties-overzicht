/**
 * Gedeelde identiteit voor sync-, dedupe- en check-scripts: bepaalt wanneer twee vacature-
 * documenten dezelfde echte vacature zijn (zelfde url, of zelfde titel + bedrijf + locatie
 * bij een andere bron) en welk Firestore-document-id erbij hoort.
 */

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    const host = u.hostname.toLowerCase();
    // be.indeed.com/viewjob?jk=... - het pad is voor ELKE indeed-vacature identiek
    // ("/viewjob"), de echte identiteit zit in de jk-queryparameter. Zonder deze
    // uitzondering vallen alle indeed-viewjob-vacatures terug op hetzelfde
    // "be-indeed-com-viewjob"-id en overschrijven ze elkaar (zie fix #60).
    const jk = u.searchParams.get("jk");
    if (host.endsWith("indeed.com") && path.endsWith("/viewjob") && jk) {
      return `${host}/viewjob-${jk.toLowerCase()}`;
    }
    return `${host}${path}`.toLowerCase();
  } catch {
    return url
      .toLowerCase()
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }
}

// Document-id afgeleid van de genormaliseerde url; null zonder url.
export function canonicalId(data) {
  if (!data.url) return null;
  const normalized = normalizeUrl(data.url);
  return normalized ? slugify(normalized) : null;
}

// Document-id zoals de sync het schrijft: expliciet `id`, anders de url, anders bedrijf+titel.
export function documentId(v) {
  if (v.id) return v.id;
  return canonicalId(v) ?? slugify(`${v.bedrijf}-${v.titel}`);
}

export function normalizeBedrijf(bedrijf) {
  return (bedrijf ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // parenthetische toevoegingen strippen, bv. "(via Cronos)"
    .trim()
    .replace(/\s+/g, " ");
}

export function locatieKern(locatie) {
  return (locatie ?? "")
    .split("(")[0]
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Sommige bronnen (bv. codejobs.be) plakken de locatie achter de titel
// ("Front-end Developer Edegem" i.p.v. "Front-end Developer"). Strip die zodat dezelfde
// vacature op beide bronnen dezelfde sleutel krijgt (CraftCode-duplicaten, 30-09-2026).
//
// Daarnaast worden schrijfwijzen herleid die niets aan de vacature veranderen: accenten,
// full-stack/fullstack/full stack (idem front-end en back-end), spaties rond "/" en
// genderachtervoegsels als "(m/v/x)". Rolniveau (senior/lead/junior) blijft wel in de sleutel.
export function normalizeTitel(titel, locatie) {
  let t = (titel ?? "").toLowerCase().trim().replace(/\s+/g, " ");
  const kern = locatieKern(locatie);
  if (kern && t.length > kern.length && t.endsWith(` ${kern}`)) {
    t = t.slice(0, -kern.length - 1).trim();
  }
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*[([]\s*[mfvxdh](?:\s*[/|]\s*[mfvxdh])+\s*[)\]]/g, "")
    .replace(/\bfull[\s-]?stack\b/g, "fullstack")
    .replace(/\bfront[\s-]?end\b/g, "frontend")
    .replace(/\bback[\s-]?end\b/g, "backend")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

export function sameJobKey(data) {
  const titel = normalizeTitel(data.titel, data.locatie);
  const bedrijf = normalizeBedrijf(data.bedrijf);
  const locatie = locatieKern(data.locatie);
  if (!titel || !bedrijf || !locatie) return null;
  return `${titel}|${bedrijf}|${locatie}`;
}
