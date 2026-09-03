import {useState} from "react";
import {Sollicitatie, SOLLICITATIE_STATUS_LABELS, SollicitatieStatus, SollicitatieStatusSchema} from "~/lib/schemas";
import {archiveVacature, updateSollicitatie} from "~/lib/vacatures";
import styles from "./SollicitatiesPanel.module.css";
import {useNavigate} from "@tanstack/react-router";

const STATUSSES = Object.keys(SOLLICITATIE_STATUS_LABELS) as SollicitatieStatus[];

interface Props {
  sollicitaties: Sollicitatie[];
  showHeader?: boolean;
}

export function SollicitatiesPanel({sollicitaties, showHeader = false}: Props) {
  const [lokaleStatussen, setLokaleStatussen] = useState<Record<string, SollicitatieStatus>>({});
  const navigate = useNavigate();

  const gesorteerd = [...sollicitaties].sort(
    (a, b) => b.gesolliceerdOp.localeCompare(a.gesolliceerdOp)
  );

  async function handleStatusChange(id: string, status: SollicitatieStatus, vacatureId?: string) {
    setLokaleStatussen((prev) => ({...prev, [id]: status}));
    try {
      await updateSollicitatie(id, status);
      if (status === SollicitatieStatusSchema.enum.afgewezen && vacatureId) {
        await archiveVacature(vacatureId, true);
        await navigate({to: "/"});
      }
    } catch {
      // Revert on failure
      setLokaleStatussen((prev) => {
        const next = {...prev};
        delete next[id];
        return next;
      });
    }
  }

  return (
    <section className={styles.panel}>
      {showHeader && (
        <div className={styles.header}>
          <span className={styles.titel}>Sollicitaties</span>
          <span className={styles.teller}>{sollicitaties.length} totaal</span>
        </div>
      )}
      <div className={styles.lijstWrapper}>
        <table className={styles.tabel}>
          <tbody>
          {gesorteerd.map((s) => {
            const currentStatus = lokaleStatussen[s.id] ?? s.status;
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
                    className={`${styles.statusSelect} ${styles[`status_${currentStatus}`]}`}
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(s.id, e.target.value as SollicitatieStatus, s.vacatureId)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUSSES.map((st) => (
                      <option key={st} value={st}>{SOLLICITATIE_STATUS_LABELS[st]}</option>
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
