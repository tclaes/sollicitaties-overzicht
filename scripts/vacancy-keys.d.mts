interface VacancyKeyInput {
  titel?: string | null;
  bedrijf?: string | null;
  locatie?: string | null;
}

export function normalizeBedrijf(bedrijf?: string | null): string;
export function locatieKern(locatie?: string | null): string;
export function normalizeTitel(titel?: string | null, locatie?: string | null): string;
export function sameJobKey(data: VacancyKeyInput): string | null;
