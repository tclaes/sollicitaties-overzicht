import {useState} from "react";
import type {Vacancy} from "~/lib/schemas";
import {todayIso} from "~/lib/date";
import styles from "./ApplyForJob.module.css";

interface Props {
  vacancy: Vacancy;
  onApply: (data: {
    vacancyId: string;
    company: string;
    role: string;
    appliedOn: string
  }) => Promise<void>;
  onApplied: (date: string) => void;
  /** Toon de knop altijd; standaard verschijnt hij pas bij hover op een tabelrij. */
  alwaysVisible?: boolean;
}

export function ApplyForJob({vacancy, onApply, onApplied, alwaysVisible = false}: Props) {
  const [open, setOpen] = useState(false);
  const [dateInput, setDateInput] = useState("");
  const [loading, setLoading] = useState(false);

  function openApply(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(true);
    setDateInput(todayIso());
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const date = dateInput || todayIso();
      await onApply({
        vacancyId: vacancy.id,
        company: vacancy.company,
        role: vacancy.title,
        appliedOn: date,
      });
      onApplied(date);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  function cancel(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
  }

  if (open) {
    return (
      <form className={styles.applyForm} onSubmit={confirm}>
        <input
          type="date"
          className={styles.dateInput}
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          autoFocus
          aria-label="autofocus"
        />
        <button type="submit" className={styles.confirmBtn} title="Bevestigen" disabled={loading}>✓
        </button>
        <button type="button" className={styles.cancelBtn} title="Annuleren" onClick={cancel}>✕
        </button>
      </form>
    );
  }

  return (
    <button className={`${styles.applyBtn} ${alwaysVisible ? styles.visible : ""}`} onClick={openApply} type="button">
      Solliciteer
    </button>
  );
}
