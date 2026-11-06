interface VacancyKeyInput {
  titel?: string | null;
  bedrijf?: string | null;
  locatie?: string | null;
}

interface VacancyIdInput {
  id?: string | null;
  url?: string | null;
  titel?: string | null;
  bedrijf?: string | null;
}

export function slugify(s: string): string;
export function normalizeUrl(url?: string | null): string | null;
export function canonicalId(data: { url?: string | null }): string | null;
export function documentId(v: VacancyIdInput): string;
export function normalizeBedrijf(bedrijf?: string | null): string;
export function locatieKern(locatie?: string | null): string;
export function normalizeTitel(titel?: string | null, locatie?: string | null): string;
export function sameJobKey(data: VacancyKeyInput): string | null;
