/**
 * Gedeelde normalisatie voor sync- en dedupe-script: bepaalt wanneer twee vacature-
 * documenten dezelfde echte vacature zijn (zelfde titel + bedrijf + locatie, andere bron).
 */

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
export function normalizeTitel(titel, locatie) {
  let t = (titel ?? "").toLowerCase().trim().replace(/\s+/g, " ");
  const kern = locatieKern(locatie);
  if (kern && t.length > kern.length && t.endsWith(` ${kern}`)) {
    t = t.slice(0, -kern.length - 1).trim();
  }
  return t;
}

export function sameJobKey(data) {
  const titel = normalizeTitel(data.titel, data.locatie);
  const bedrijf = normalizeBedrijf(data.bedrijf);
  const locatie = locatieKern(data.locatie);
  if (!titel || !bedrijf || !locatie) return null;
  return `${titel}|${bedrijf}|${locatie}`;
}
