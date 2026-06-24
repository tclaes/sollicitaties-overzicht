import {SollicitatieStatus, Status} from "./schemas";
import {doc, updateDoc} from "firebase/firestore";
import {db} from "~/lib/firebase";

const KEY = "vacature-statussen";
const DATUM_KEY = "vacature-sollicitaties";

export async function updateSollicitatie(
  id: string,
  status: SollicitatieStatus,
): Promise<void> {
  await updateDoc(doc(db, "sollicitaties", id), {status});
}

export async function setStatus(id: string, status: Status) {
  await updateDoc(doc(db, 'vacatures', id), {status})
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
