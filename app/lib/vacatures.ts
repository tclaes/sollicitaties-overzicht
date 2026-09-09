import {z} from "zod";
import {collection, deleteField, doc, getDocs, setDoc, updateDoc,} from "firebase/firestore";
import {db} from "./firebase";
import {Sollicitatie, SollicitatieSchema, SollicitatieStatus, Vacature, VacatureSchema,} from "./schemas";

export async function getAllVacatures(): Promise<Vacature[]> {
  try {
    const vacaturesSnap = await getDocs(collection(db, "vacatures"));
    return vacaturesSnap.docs.map((d) => VacatureSchema.parse(d.data()));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getVacaturesDashboard() {
  const allVacatures = await getAllVacatures();
  return allVacatures?.filter(v => !v.isArchived)
}

export async function getSollicitaties(): Promise<Sollicitatie[]> {
  try {
    const snapshot = await getDocs(collection(db, "sollicitaties"));
    return z
      .array(SollicitatieSchema)
      .parse(snapshot.docs.map((d) => ({id: d.id, ...d.data()})));
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
  await Promise.all([
    setDoc(doc(db, "sollicitaties", id), {
      status: "gesolliciteerd",
      ...data,
    }),
    updateDoc(doc(db, "vacatures", data.vacatureId), {
      status: "gesolliciteerd",
    }),
  ]);
}

export async function updateSollicitatie(
  id: string,
  status: SollicitatieStatus,
): Promise<void> {
  await updateDoc(doc(db, "sollicitaties", id), {status});
}

export async function getVacature(id: string): Promise<Vacature | null> {
  const allVacatures = await getAllVacatures();
  return allVacatures?.find((v) => v.id === id) ?? null;
}

export async function archiveVacature(
  id: string,
  isArchived: boolean,
): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {isArchived});
}

export async function markeerNietInteressant(
  id: string,
  reden: string,
): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {
    isArchived: true,
    status: "niet-interessant",
    archiefReden: reden,
    gearchiveerdOp: new Date().toISOString(),
  });
}

export async function herstelVacature(id: string): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {
    isArchived: false,
    status: "bekeken",
    archiefReden: deleteField(),
    gearchiveerdOp: deleteField(),
  });
}
