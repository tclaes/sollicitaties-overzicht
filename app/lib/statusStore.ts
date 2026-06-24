import {SollicitatieStatus, Status} from "./schemas";
import {doc, updateDoc} from "firebase/firestore";
import {db} from "~/lib/firebase";

export async function updateSollicitatie(
  id: string,
  status: SollicitatieStatus,
): Promise<void> {
  await updateDoc(doc(db, "sollicitaties", id), {status});
}

export async function setStatus(id: string, status: Status) {
  await updateDoc(doc(db, 'vacatures', id), {status})
}
