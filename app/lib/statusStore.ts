import type { Status } from "./schemas";

const KEY = "vacature-statussen";
const DATUM_KEY = "vacature-sollicitaties";

export function getAlleStatussen(): Record<string, Status> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function setStatus(id: string, status: Status): void {
  const statussen = getAlleStatussen();
  statussen[id] = status;
  localStorage.setItem(KEY, JSON.stringify(statussen));
}

export function getStatus(id: string): Status | undefined {
  return getAlleStatussen()[id];
}

export function getSollicitatieDatum(id: string): string | undefined {
  try {
    return JSON.parse(localStorage.getItem(DATUM_KEY) ?? "{}")[id];
  } catch {
    return undefined;
  }
}

export function setSollicitatieDatum(id: string, datum: string): void {
  const datums = JSON.parse(localStorage.getItem(DATUM_KEY) ?? "{}");
  datums[id] = datum;
  localStorage.setItem(DATUM_KEY, JSON.stringify(datums));
}
