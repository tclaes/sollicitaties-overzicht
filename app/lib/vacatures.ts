import { z } from "zod";
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { DagOverzichtSchema, SollicitatieSchema } from "./schemas";
import type { Vacature, DagOverzicht, Sollicitatie, SollicitatieStatus } from "./schemas";
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
  try {
    const snapshot = await getDocs(collection(db, "sollicitaties"));
    return z.array(SollicitatieSchema).parse(
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    );
  } catch {
    return [];
  }
}

export async function createSollicitatie(data: {
  vacatureId: string;
  bedrijf: string;
  rol: string;
  gesolliceerdOp: string;
}): Promise<void> {
  const id = `${data.bedrijf.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${data.gesolliceerdOp}`;
  await setDoc(doc(db, "sollicitaties", id), {
    status: "gesolliciteerd",
    ...data,
  });
}

export async function updateSollicitatie(id: string, status: SollicitatieStatus): Promise<void> {
  await updateDoc(doc(db, "sollicitaties", id), { status });
}

export async function getAlleVacatures(): Promise<Vacature[]> {
  const overzicht = await getVacaturesOverzicht();
  return overzicht?.vacatures ?? [];
}

export async function getVacature(id: string): Promise<Vacature | null> {
  const overzicht = await getVacaturesOverzicht();
  return overzicht?.vacatures.find((v) => v.id === id) ?? null;
}
