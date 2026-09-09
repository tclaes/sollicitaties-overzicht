import {useState} from "react";
import {Application, APPLICATION_STATUS_LABELS, ApplicationStatus, ApplicationStatusSchema} from "~/lib/schemas";
import {archiveVacancy, updateApplication} from "~/lib/vacancies";
import styles from "./ApplicationsPanel.module.css";
import {useNavigate} from "@tanstack/react-router";

const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];

interface Props {
  applications: Application[];
  showHeader?: boolean;
}

export function ApplicationsPanel({applications, showHeader = false}: Props) {
  const [localStatuses, setLocalStatuses] = useState<Record<string, ApplicationStatus>>({});
  const navigate = useNavigate();

  const sorted = [...applications].sort(
    (a, b) => b.gesolliceerdOp.localeCompare(a.gesolliceerdOp)
  );

  async function handleStatusChange(id: string, status: ApplicationStatus, vacatureId?: string) {
    setLocalStatuses((prev) => ({...prev, [id]: status}));
    try {
      await updateApplication(id, status);
      if (status === ApplicationStatusSchema.enum.afgewezen && vacatureId) {
        await archiveVacancy(vacatureId, true);
        await navigate({to: "/"});
      }
    } catch {
      // Revert on failure
      setLocalStatuses((prev) => {
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
          <span className={styles.title}>Sollicitaties</span>
          <span className={styles.counter}>{applications.length} totaal</span>
        </div>
      )}
      <div className={styles.listWrapper}>
        <table className={styles.table}>
          <tbody>
          {sorted.map((s) => {
            const currentStatus = localStatuses[s.id] ?? s.status;
            return (
              <tr key={s.id} className={styles.row} title={s.notitie}>
                <td className={styles.date}>
                  {new Date(s.gesolliceerdOp).toLocaleDateString("nl-BE", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className={styles.company}>{s.bedrijf}</td>
                <td className={styles.role}>{s.rol}</td>
                <td className={styles.statusCol}>
                  <select
                    className={`${styles.statusSelect} ${styles[`status_${currentStatus}`]}`}
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(s.id, e.target.value as ApplicationStatus, s.vacatureId)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>{APPLICATION_STATUS_LABELS[st]}</option>
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
