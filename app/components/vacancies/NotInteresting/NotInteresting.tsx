import {useState} from "react";
import {restoreVacancy, markNotInteresting} from "~/lib/vacancies";
import {useNavigate, useRouter} from "@tanstack/react-router";
import styles from "./NotInteresting.module.css"

export function NotInteresting({id, isArchived, reason}: { id: string; isArchived: boolean; reason?: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await markNotInteresting(id, text.trim() || "Niet interessant voor mij");
      await router.invalidate();
      await navigate({to: "/vacatures"});
    } finally {
      setBusy(false);
    }
  }

  async function repair() {
    setBusy(true);
    try {
      await restoreVacancy(id);
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  }

  if (isArchived) {
    return (
      <section className={styles.archive}>
        <h2 className={styles.sectionTitle}>Gearchiveerd — niet interessant</h2>
        <p className={styles.archiveReason}>{reason || "Niet interessant voor mij"}</p>
        <button type="button" className={styles.repairBtn} onClick={repair} disabled={busy}>
          Terugzetten
        </button>
      </section>
    );
  }

  return (
    <section className={styles.archive}>
      {!open ? (
        <button type="button" className={styles.notInterestingBtn} onClick={() => setOpen(true)}>
          Niet interessant
        </button>
      ) : (
        <form className={styles.archiveForm} onSubmit={confirm}>
          <label htmlFor="archiefReden" className={styles.sectionTitle}>
            Waarom is deze vacature niet interessant?
          </label>
          <textarea
            id="archiefReden"
            className={styles.archiveTextarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Bijv. te backend-gericht, buiten de regio, freelance…"
          />
          <div className={styles.archiveActions}>
            <button type="submit" className={styles.notInterestingBtn} disabled={busy}>
              Archiveren
            </button>
            <button type="button" className={styles.repairBtn} onClick={() => setOpen(false)} disabled={busy}>
              Annuleren
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
