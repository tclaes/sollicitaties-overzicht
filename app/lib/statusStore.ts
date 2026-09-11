import {ApplicationStatus, Status} from "./schemas";
import {doc, updateDoc} from "firebase/firestore";
import {db} from "~/lib/firebase";
import {applicationStatusToFirestore, statusToFirestore} from "~/lib/firestoreMappers";

const KEY = "vacature-statussen";
const DATE_KEY = "vacature-sollicitaties";

export async function updateApplication(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  await updateDoc(doc(db, "sollicitaties", id), {status: applicationStatusToFirestore(status)});
}

export async function setStatus(id: string, status: Status) {
  await updateDoc(doc(db, 'vacatures', id), {status: statusToFirestore(status)})
}

export function getApplicationDate(id: string): string | undefined {
  try {
    return JSON.parse(localStorage.getItem(DATE_KEY) ?? "{}")[id];
  } catch {
    return undefined;
  }
}

export function setApplicationDate(id: string, date: string): void {
  const dates = JSON.parse(localStorage.getItem(DATE_KEY) ?? "{}");
  dates[id] = date;
  localStorage.setItem(DATE_KEY, JSON.stringify(dates));
}
