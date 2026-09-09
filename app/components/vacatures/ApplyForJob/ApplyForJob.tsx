import {useState} from "react";
import type {Vacature} from "~/lib/schemas";
import {todayIso} from "~/lib/date";
import styles from "./ApplyForJob.module.css";

interface Props {
  vacature: Vacature;
  onSolliciteer: (data: {
    vacatureId: string;
    bedrijf: string;
    rol: string;
    gesolliceerdOp: string
  }) => Promise<void>;
  onGesolliciteerd: (datum: string) => void;
}

export function ApplyForJob({vacature, onSolliciteer, onGesolliciteerd}: Props) {
  const [open, setOpen] = useState(false);
  const [datumInput, setDatumInput] = useState("");
  const [loading, setLoading] = useState(false);

  function openSolliciteer(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(true);
    setDatumInput(todayIso());
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const datum = datumInput || todayIso();
      await onSolliciteer({
        vacatureId: vacature.id,
        bedrijf: vacature.bedrijf,
        rol: vacature.titel,
        gesolliceerdOp: datum,
      });
      onGesolliciteerd(datum);
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
      <form className={styles.solliciteerForm} onSubmit={confirm}>
        <input
          type="date"
          className={styles.datumInput}
          value={datumInput}
          onChange={(e) => setDatumInput(e.target.value)}
          autoFocus
          aria-label="autofocus"
        />
        <button type="submit" className={styles.bevestigBtn} title="Bevestigen" disabled={loading}>✓
        </button>
        <button type="button" className={styles.annuleerBtn} title="Annuleren" onClick={cancel}>✕
        </button>
      </form>
    );
  }

  return (
    <button className={styles.solliciteerBtn} onClick={openSolliciteer} type="button">
      Solliciteer
    </button>
  );
}
