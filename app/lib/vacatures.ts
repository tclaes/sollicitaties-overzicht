import { z } from "zod";
import { DagOverzichtSchema, SollicitatieSchema } from "./schemas";
import type { Vacature, DagOverzicht, Sollicitatie } from "./schemas";

export async function getAlleDatums(): Promise<string[]> {
  const res = await fetch("/data/index.json");
  if (!res.ok) return [];
  return z.array(z.string()).parse(await res.json());
}

export async function getVacaturesVoorDatum(datum: string): Promise<DagOverzicht | null> {
  const res = await fetch(`/data/vacatures/${datum}.json`);
  if (!res.ok) return null;
  return DagOverzichtSchema.parse(await res.json());
}

export async function getVacaturesVandaag(): Promise<DagOverzicht | null> {
  const datum = new Date().toISOString().slice(0, 10);
  return getVacaturesVoorDatum(datum);
}

export async function getSollicitaties(): Promise<Sollicitatie[]> {
  const res = await fetch("/data/sollicitaties.json");
  if (!res.ok) return [];
  return z.array(SollicitatieSchema).parse(await res.json());
}

export async function getAlleVacatures(): Promise<Vacature[]> {
  const datums = await getAlleDatums();
  const resultaten = await Promise.all(datums.map(getVacaturesVoorDatum));
  return resultaten.flatMap((o) => o?.vacatures ?? []);
}

export async function getVacature(id: string): Promise<Vacature | null> {
  const datums = await getAlleDatums();
  for (const datum of datums) {
    const overzicht = await getVacaturesVoorDatum(datum);
    if (!overzicht) continue;
    const gevonden = overzicht.vacatures.find((v) => v.id === id);
    if (gevonden) return gevonden;
  }
  return null;
}
