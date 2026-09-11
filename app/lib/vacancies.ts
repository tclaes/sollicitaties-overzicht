import {collection, deleteField, doc, getDocs, setDoc, updateDoc,} from "firebase/firestore";
import {db} from "./firebase";
import {Application, ApplicationStatus, Vacancy,} from "./schemas";
import {
  applicationFromFirestore,
  applicationStatusToFirestore,
  statusToFirestore,
  vacancyFromFirestore,
} from "./firestoreMappers";

export async function getAllVacancies(): Promise<Vacancy[]> {
  try {
    const vacanciesSnap = await getDocs(collection(db, "vacatures"));
    return vacanciesSnap.docs.map((d) => vacancyFromFirestore(d.data()));
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
    return snapshot.docs.map((d) => applicationFromFirestore({id: d.id, ...d.data()}));
  } catch {
    return [];
  }
}

export async function createApplication(data: {
  vacancyId: string;
  company: string;
  role: string;
  appliedOn: string;
}): Promise<void> {
  const id = `${data.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${data.appliedOn}`;
  await Promise.all([
    setDoc(doc(db, "sollicitaties", id), {
      vacatureId: data.vacancyId,
      bedrijf: data.company,
      rol: data.role,
      gesolliceerdOp: data.appliedOn,
      status: applicationStatusToFirestore("applied"),
    }),
    updateDoc(doc(db, "vacatures", data.vacancyId), {
      status: statusToFirestore("applied"),
    }),
  ]);
}

export async function updateApplication(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  await updateDoc(doc(db, "sollicitaties", id), {status: applicationStatusToFirestore(status)});
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
    status: statusToFirestore("not-interesting"),
    archiefReden: reason,
    gearchiveerdOp: new Date().toISOString(),
  });
}

export async function restoreVacancy(id: string): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {
    isArchived: false,
    status: statusToFirestore("viewed"),
    archiefReden: deleteField(),
    gearchiveerdOp: deleteField(),
  });
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {favoriet: favorite});
}
