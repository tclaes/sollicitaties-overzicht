import {ROLE_LABELS, Vacancy} from "./schemas";

export interface VacancyFilter {
  status?: string;
  source?: string;
  function?: string;
  q?: string;
  archived?: boolean;
}

function searchableText(vacancy: Vacancy): string {
  const role = vacancy.function ? [vacancy.function, ROLE_LABELS[vacancy.function]] : [];
  return [vacancy.title, ...role, ...vacancy.tags].join(" ").toLowerCase();
}

// Elke zoekterm moet voorkomen in de titel, de functie of één van de tags.
export function matchesQuery(vacancy: Vacancy, query?: string): boolean {
  const terms = query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  if (terms.length === 0) return true;
  const text = searchableText(vacancy);
  return terms.every((term) => text.includes(term));
}

export function filterVacancies(vacancies: Vacancy[], filter: VacancyFilter): Vacancy[] {
  const showArchive = filter.status === "not-interesting" || filter.status === "not-hired";

  return vacancies.filter((v) => {
    if (showArchive) {
      if (!v.isArchived) return false;
      if (filter.status === "not-hired" && v.status !== "not-hired") return false;
    } else {
      if (v.isArchived && !filter.archived) return false;
      if (filter.status && v.status !== filter.status) return false;
    }
    if (filter.function && v.function !== filter.function) return false;
    if (filter.source && v.source !== filter.source) return false;
    return matchesQuery(v, filter.q);
  });
}
