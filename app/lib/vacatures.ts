import { z } from "zod";
import { DagOverzichtSchema, SollicitatieSchema } from "./schemas";
import type { Vacature, DagOverzicht, Sollicitatie } from "./schemas";
import { getAlleStatussen } from "./statusStore";

function applyStatussen(vacatures: Vacature[]): Vacature[] {
  const overrides = getAlleStatussen();
  if (Object.keys(overrides).length === 0) return vacatures;
  return vacatures.map((v) => (overrides[v.id] ? { ...v, status: overrides[v.id] } : v));
}

export async function getVacaturesOverzicht(): Promise<DagOverzicht | null> {
  try {
    const res = await fetch("/data/vacatures/data.json");
    if (!res.ok) return null;
    const overzicht = DagOverzichtSchema.parse(await res.json());
    return { ...overzicht, vacatures: applyStatussen(overzicht.vacatures) };
  } catch {
    return null;
  }
}

export async function getSollicitaties(): Promise<Sollicitatie[]> {
  const res = await fetch("/data/sollicitaties.json");
  if (!res.ok) return [];
  return z.array(SollicitatieSchema).parse(await res.json());
}

export async function getAlleVacatures(): Promise<Vacature[]> {
  const overzicht = await getVacaturesOverzicht();
  return overzicht?.vacatures ?? [];
}

export async function getVacature(id: string): Promise<Vacature | null> {
  const overzicht = await getVacaturesOverzicht();
  return overzicht?.vacatures.find((v) => v.id === id) ?? null;
}

