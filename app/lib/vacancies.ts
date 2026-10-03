import {
  collection,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {db} from "./firebase";
import {Application, ApplicationStatus, Status, Vacancy,} from "./schemas";
import {
  applicationFromFirestore,
  applicationStatusToFirestore,
  statusToFirestore,
  vacancyFromFirestore,
} from "./firestoreMappers";

// Gearchiveerde vacatures worden niet standaard geladen: ze zijn alleen nodig in
// het archief of bij "Inclusief gearchiveerd" (zie getArchivedVacancies).
const ARCHIVED_STATUSES = ["niet-interessant", "niet-aangeworven"];

// Een document zonder `isArchived`-veld (alles wat de sync aanmaakt) valt buiten
// `isArchived != true`, daarom filteren we op status. Een document met
// isArchived: true én een actieve status wordt later in filterVacancies verborgen.
export async function getActiveVacancies(): Promise<Vacancy[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "vacatures"), where("status", "not-in", ARCHIVED_STATUSES)),
    );
    return snap.docs.map((d) => vacancyFromFirestore(d.data()));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getArchivedVacancies(): Promise<Vacancy[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "vacatures"), where("isArchived", "==", true)),
    );
    return snap.docs.map((d) => vacancyFromFirestore(d.data()));
  } catch (err) {
    console.error(err);
    return [];
  }
}

export type VacancyCounts = { total: number } & Record<Status, number>;

const EMPTY_COUNTS: VacancyCounts = {
  total: 0,
  new: 0,
  viewed: 0,
  applied: 0,
  rejected: 0,
  "not-interesting": 0,
  "not-hired": 0,
};

// Aggregatietellingen: tellen op de server zonder de documenten te downloaden,
// zodat de statusbalk ook het (niet-geladen) archief kan tonen.
export async function getVacancyCounts(): Promise<VacancyCounts> {
  const statuses = Object.keys(EMPTY_COUNTS).filter((k) => k !== "total") as Status[];
  try {
    const vacancies = collection(db, "vacatures");
    const [total, ...perStatus] = await Promise.all([
      getCountFromServer(vacancies),
      ...statuses.map((s) => getCountFromServer(query(vacancies, where("status", "==", statusToFirestore(s))))),
    ]);
    return statuses.reduce<VacancyCounts>(
      (acc, status, i) => ({...acc, [status]: perStatus[i].data().count}),
      {...EMPTY_COUNTS, total: total.data().count},
    );
  } catch (err) {
    console.error(err);
    return EMPTY_COUNTS;
  }
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
  try {
    const snap = await getDoc(doc(db, "vacatures", id));
    return snap.exists() ? vacancyFromFirestore({id: snap.id, ...snap.data()}) : null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Enige aanroeper is de sollicitatie-statusdropdown (ApplicationsPanel /
// ApplicationStatus) zodra een sollicitatie op "niet aangeworven" wordt gezet.
// Zonder de vacature-status hier mee te synchroniseren bleef die voor altijd
// op "gesolliciteerd" staan - isArchived werd wel true, maar de "Niet
// aangeworven"-teller op het overzicht bleef 0 (gevonden en gefixt 23-09-2026,
// zie scripts/sync-vacancy-not-hired-status.mjs voor de eenmalige data-fix).
export async function archiveVacancy(
  id: string,
  isArchived: boolean,
): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {
    isArchived,
    ...(isArchived
      ? {
        status: statusToFirestore("not-hired"),
        archiefReden: "Niet aangenomen na sollicitatie",
        gearchiveerdOp: new Date().toISOString(),
      }
      : {}),
  });
}

export async function markNotInteresting(
  id: string,
  reason: string,
  currentStatus?: Status,
): Promise<void> {
  const targetStatus: Status = currentStatus === "applied" ? "not-hired" : "not-interesting";
  await updateDoc(doc(db, "vacatures", id), {
    isArchived: true,
    status: statusToFirestore(targetStatus),
    archiefReden: reason,
    gearchiveerdOp: new Date().toISOString(),
  });
}

export async function restoreVacancy(id: string, wasNotHired?: boolean): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {
    isArchived: false,
    status: statusToFirestore(wasNotHired ? "applied" : "viewed"),
    archiefReden: deleteField(),
    gearchiveerdOp: deleteField(),
  });
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<void> {
  await updateDoc(doc(db, "vacatures", id), {favoriet: favorite});
}
