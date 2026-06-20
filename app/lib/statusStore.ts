import type { Status } from "./schemas";

const KEY = "vacature-statussen";

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
