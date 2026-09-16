import {useState} from "react";
import {restoreVacancy, markNotInteresting} from "~/lib/vacancies";
import {useCanGoBack, useNavigate, useRouter} from "@tanstack/react-router";
import type {Status} from "~/lib/schemas";
import styles from "./NotInteresting.module.css"

export function NotInteresting(
  {id, isArchived, reason, status}: { id: string; isArchived: boolean; reason?: string; status?: Status },
) {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await markNotInteresting(id, text.trim() || "Niet interessant voor mij", status);
      await router.invalidate();
      if (canGoBack) {
        router.history.back();
      } else {
        await navigate({to: "/vacatures"});
      }
    } finally {
      setBusy(false);
    }
  }

  async function repair() {
    setBusy(true);
    try {
      await restoreVacancy(id, status === "not-hired");
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  }

  if (isArchived) {
    const title = status === "not-hired" ? "Gearchiveerd — niet aangeworven" : "Gearchiveerd — niet interessant";
    return (
      <section className={styles.archive}>
        <h2 className={styles.sectionTitle}>{title}</h2>
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
