import { useState } from "react";
import type { Sollicitatie, SollicitatieStatus } from "~/lib/schemas";
import { updateSollicitatie } from "~/lib/vacatures";
import styles from "./SollicitatiesPanel.module.css";

const STATUS_LABELS: Record<SollicitatieStatus, string> = {
  gesolliciteerd: "wacht",
  in_gesprek: "in gesprek",
  afgewezen: "afgewezen",
  niet_wervend: "niet wervend",
  geen_reactie: "geen reactie",
  aangenomen: "aangenomen",
};

const STATUSSEN = Object.keys(STATUS_LABELS) as SollicitatieStatus[];

interface Props {
  sollicitaties: Sollicitatie[];
  toonHeader?: boolean;
}

export function SollicitatiesPanel({ sollicitaties, toonHeader = false }: Props) {
  const [lokaleStatussen, setLokaleStatussen] = useState<Record<string, SollicitatieStatus>>({});

  const gesorteerd = [...sollicitaties].sort(
    (a, b) => b.gesolliceerdOp.localeCompare(a.gesolliceerdOp)
  );

  async function handleStatusChange(id: string, status: SollicitatieStatus) {
    setLokaleStatussen((prev) => ({ ...prev, [id]: status }));
    try {
      await updateSollicitatie(id, status);
    } catch {
      // Revert on failure
      setLokaleStatussen((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  return (
    <section className={styles.panel}>
      {toonHeader && (
        <div className={styles.header}>
          <span className={styles.titel}>Sollicitaties</span>
          <span className={styles.teller}>{sollicitaties.length} totaal</span>
        </div>
      )}
      <div className={styles.lijstWrapper}>
        <table className={styles.tabel}>
          <tbody>
            {gesorteerd.map((s) => {
              const huidigStatus = lokaleStatussen[s.id] ?? s.status;
              return (
                <tr key={s.id} className={styles.rij} title={s.notitie}>
                  <td className={styles.datum}>
                    {new Date(s.gesolliceerdOp).toLocaleDateString("nl-BE", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className={styles.bedrijf}>{s.bedrijf}</td>
                  <td className={styles.rol}>{s.rol}</td>
                  <td className={styles.statusCol}>
                    <select
                      className={`${styles.statusSelect} ${styles[`status_${huidigStatus}`]}`}
                      value={huidigStatus}
                      onChange={(e) => handleStatusChange(s.id, e.target.value as SollicitatieStatus)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STATUSSEN.map((st) => (
                        <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
