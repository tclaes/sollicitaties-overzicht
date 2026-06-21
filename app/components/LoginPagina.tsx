import { useState } from "react";
import { login } from "~/lib/auth";
import styles from "./LoginPagina.module.css";

export function LoginPagina() {
  const [email, setEmail] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    setBezig(true);
    try {
      await login(email, wachtwoord);
    } catch {
      setFout("Ongeldig e-mailadres of wachtwoord.");
    } finally {
      setBezig(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.titel}>Sollicitaties</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            E-mail
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
            />
          </label>
          <label className={styles.label}>
            Wachtwoord
            <input
              type="password"
              className={styles.input}
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {fout && <p className={styles.fout}>{fout}</p>}
          <button type="submit" className={styles.btn} disabled={bezig}>
            {bezig ? "Inloggen…" : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
