import {z} from "zod";
import {collection, deleteField, doc, getDocs, setDoc, updateDoc,} from "firebase/firestore";
import {db} from "./firebase";
import {Application, ApplicationSchema, ApplicationStatus, Vacancy, VacancySchema,} from "./schemas";

export async function getAllVacancies(): Promise<Vacancy[]> {
  try {
    const vacanciesSnap = await getDocs(collection(db, "vacatures"));
    return vacanciesSnap.docs.map((d) => VacancySchema.parse(d.data()));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getVacanciesDashboard() {
  const allVacancies = await getAllVacancies();
  return allVacancies?.filter(v => !v.isArchived)
}

export async function getApplications(): Promise<Application[]> {
  try {
    const snapshot = await getDocs(collection(db, "sollicitaties"));
    return z
      .array(ApplicationSchema)
      .parse(snapshot.docs.map((d) => ({id: d.id, ...d.data()})));
  } catch {
    return [];
  }
}

export async function createApplication(data: {
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

export async function updateApplication(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  await updateDoc(doc(db, "sollicitaties", id), {status});
}

export async function getVacancy(id: string): Promise<Vacancy | null> {
  const allVacancies = await getAllVacancies();
  return allVacancies?.find((v) => v.id === id) ?? null;
}

export async function archiveVacancy(
  id: string,
  isArchived: boolean,
): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {isArchived});
}

export async function markNotInteresting(
  id: string,
  reason: string,
): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {
    isArchived: true,
    status: "niet-interessant",
    archiefReden: reason,
    gearchiveerdOp: new Date().toISOString(),
  });
}

export async function restoreVacancy(id: string): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {
    isArchived: false,
    status: "bekeken",
    archiefReden: deleteField(),
    gearchiveerdOp: deleteField(),
  });
}
