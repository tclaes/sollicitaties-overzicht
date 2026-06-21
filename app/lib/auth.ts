import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";

export async function login(email: string, wachtwoord: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, wachtwoord);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function huidigGebruiker() {
  return auth.currentUser;
}
