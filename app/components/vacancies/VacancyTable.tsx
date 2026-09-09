import {useState} from "react";
import type {Application, Vacancy} from "~/lib/schemas";
import {ROLE_LABELS, APPLICATION_STATUS_LABELS} from "~/lib/schemas";
import {SourceBadge} from "../elements/SourceBadge";
import {Badge} from "../elements/Badge/Badge"
import {ApplyForJob} from "./ApplyForJob/ApplyForJob";
import styles from "./VacancyTable.module.css";
import {useNavigate} from '@tanstack/react-router'


interface Props {
  vacancies: Vacancy[];
  applicationById?: Map<string, Application>;
  onApply?: (data: {
    vacatureId: string;
    bedrijf: string;
    rol: string;
    gesolliceerdOp: string
  }) => Promise<void>;
}

export function VacancyTable({vacancies, applicationById = new Map(), onApply}: Props) {
  const [locallyApplied, setLocallyApplied] = useState<Record<string, string>>({});
  const navigate = useNavigate();


  if (vacancies.length === 0) {
    return <div className={styles.empty}>Geen vacatures gevonden.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
        <tr>
          <th className={styles.colStatus}>Status</th>
          <th className={styles.colSource}>Bron</th>
          <th>Functie</th>
          <th className={styles.colTags}>Tags</th>
          <th className={styles.colLocation}>Locatie</th>
          <th className={styles.colMatch}>Match</th>
          <th className={styles.colApply}></th>
        </tr>
        </thead>
        <tbody>
        {vacancies.map((v) => {
          const application = applicationById.get(v.id);
          const localDate = locallyApplied[v.id];
          const hasApplied = !!application || !!localDate;
          const applicationLabel = application
            ? APPLICATION_STATUS_LABELS[application.status]
            : localDate
              ? "wacht"
              : null;
          const date = application?.gesolliceerdOp ?? localDate;

          return (
            <tr
              key={v.id}
              className={`${styles.row} vacancy-row`}
              onClick={async () => {
                await navigate({to: `/vacatures/${v.id}`})
              }}
            >
              <td>
                <Badge status={hasApplied ? "gesolliciteerd" : v.status}/>
                {hasApplied && applicationLabel && (
                  <span className={styles.applicationLabel}>{applicationLabel}</span>
                )}
                {hasApplied && date && (
                  <span className={styles.applicationDate}>{date}</span>
                )}
              </td>
              <td>
                <SourceBadge source={v.bron}/>
              </td>
              <td className={styles.roleCol}>
                <span className={styles.title}>
                  {v.titel}
                  {v.functie && (
                    <span className={`${styles.roleBadge} ${styles[`role_${v.functie}`]}`}>
                      {ROLE_LABELS[v.functie]}
                    </span>
                  )}
                </span>
                <span className={styles.company}>{v.bedrijf}</span>
              </td>
              <td>
                <ul className={styles.tags} aria-label="Tags">
                  {v.tags.slice(0, 3).map((tag) => (
                    <li key={tag} className={styles.tag}>{tag}</li>
                  ))}
                </ul>
              </td>
              <td className={styles.location}>{v.locatie.split(",")[0]}</td>
              <td>
                {v.match ? (
                  <span
                    className={`${styles.matchBadge} ${styles[`match_${v.match.score}`]}`}
                    title={v.match.toelichting}
                  >
                      {v.match.score}
                    </span>
                ) : null}
              </td>
              <td className={styles.colApply} onClick={(e) => e.stopPropagation()}>
                {!hasApplied && onApply && (
                  <ApplyForJob
                    vacancy={v}
                    onApply={onApply}
                    onApplied={(date) =>
                      setLocallyApplied((prev) => ({...prev, [v.id]: date}))
                    }
                  />
                )}
              </td>
            </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
}
