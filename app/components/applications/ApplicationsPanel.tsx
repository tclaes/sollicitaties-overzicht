import {useState} from "react";
import {Application, APPLICATION_STATUS_LABELS, ApplicationStatus, ApplicationStatusSchema} from "~/lib/schemas";
import {archiveVacancy, updateApplication} from "~/lib/vacancies";
import styles from "./ApplicationsPanel.module.css";
import {useNavigate} from "@tanstack/react-router";

const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];

const STATUS_CSS_CLASS: Record<ApplicationStatus, string> = {
  applied: "status_gesolliciteerd",
  interviewing: "status_in_gesprek",
  rejected: "status_afgewezen",
  not_hiring: "status_niet_wervend",
  no_response: "status_geen_reactie",
  hired: "status_aangenomen",
};

interface Props {
  applications: Application[];
  showHeader?: boolean;
}

export function ApplicationsPanel({applications, showHeader = false}: Props) {
  const [localStatuses, setLocalStatuses] = useState<Record<string, ApplicationStatus>>({});
  const navigate = useNavigate();

  const sorted = [...applications].sort(
    (a, b) => b.appliedOn.localeCompare(a.appliedOn)
  );

  async function handleStatusChange(id: string, status: ApplicationStatus, vacancyId?: string) {
    setLocalStatuses((prev) => ({...prev, [id]: status}));
    try {
      await updateApplication(id, status);
      if (status === ApplicationStatusSchema.enum.rejected && vacancyId) {
        await archiveVacancy(vacancyId, true);
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
              <tr key={s.id} className={styles.row} title={s.note}>
                <td className={styles.date}>
                  {new Date(s.appliedOn).toLocaleDateString("nl-BE", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className={styles.company}>{s.company}</td>
                <td className={styles.role}>{s.role}</td>
                <td className={styles.statusCol}>
                  <select
                    className={`${styles.statusSelect} ${styles[STATUS_CSS_CLASS[currentStatus]]}`}
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(s.id, e.target.value as ApplicationStatus, s.vacancyId)}
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
