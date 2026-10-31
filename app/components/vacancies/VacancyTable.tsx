import type {Application, Vacancy} from "~/lib/schemas";
import {MATCH_SCORE_LABELS, ROLE_LABELS} from "~/lib/schemas";
import {SourceBadge} from "../elements/SourceBadge";
import {Badge} from "../elements/Badge/Badge"
import {FavoriteButton} from "../elements/FavoriteButton/FavoriteButton";
import {ApplyForJob} from "./ApplyForJob/ApplyForJob";
import {ApplicationStatus} from "./ApplicationStatus/ApplicationStatus";
import styles from "./VacancyTable.module.css";
import {useVacancyRows} from "./useVacancyRows";

const MATCH_SCORE_CSS_CLASS: Record<string, string> = {
  strong: "match_sterk",
  good: "match_goed",
  moderate: "match_matig",
  low: "match_laag",
};

interface Props {
  vacancies: Vacancy[];
  applicationById?: Map<string, Application>;
  onApply?: (data: {
    vacancyId: string;
    company: string;
    role: string;
    appliedOn: string
  }) => Promise<void>;
}

export function VacancyTable({vacancies, applicationById = new Map(), onApply}: Props) {
  const rows = useVacancyRows(applicationById);

  if (vacancies.length === 0) {
    return <div className={styles.empty}>Geen vacatures gevonden.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
        <tr>
          <th className={styles.colFavorite}></th>
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
          const {application, hasApplied, effectiveStatus, date, isFavorite} = rows.getRow(v);

          return (
            <tr
              key={v.id}
              className={`${styles.row} vacancy-row`}
              onClick={() => rows.openVacancy(v.id)}
            >
              <td className={styles.colFavorite} onClick={(e) => e.stopPropagation()}>
                <FavoriteButton
                  id={v.id}
                  favorite={isFavorite}
                  onToggled={(next) => rows.setFavorite(v.id, next)}
                />
              </td>
              <td onClick={(e) => application && e.stopPropagation()}>
                {application && effectiveStatus ? (
                  <ApplicationStatus
                    applicationId={application.id}
                    vacancyId={v.id}
                    status={effectiveStatus}
                    onChanged={(next) => rows.changeStatus(application.id, next)}
                  />
                ) : (
                  <Badge status={hasApplied ? "applied" : v.status}/>
                )}
                {hasApplied && date && (
                  <span className={styles.applicationDate}>{date}</span>
                )}
              </td>
              <td>
                <SourceBadge source={v.source}/>
              </td>
              <td className={styles.roleCol}>
                <span className={styles.title}>
                  {v.title}
                  {v.function && (
                    <span className={`${styles.roleBadge} ${styles[`role_${v.function}`]}`}>
                      {ROLE_LABELS[v.function]}
                    </span>
                  )}
                </span>
                <span className={styles.company}>{v.company}</span>
              </td>
              <td>
                <ul className={styles.tags} aria-label="Tags">
                  {v.tags.slice(0, 3).map((tag) => (
                    <li key={tag} className={styles.tag}>{tag}</li>
                  ))}
                </ul>
              </td>
              <td className={styles.location}>{v.location.split(",")[0]}</td>
              <td>
                {v.match ? (
                  <span
                    className={`${styles.matchBadge} ${styles[MATCH_SCORE_CSS_CLASS[v.match.score]]}`}
                    title={v.match.explanation}
                  >
                      {MATCH_SCORE_LABELS[v.match.score]}
                    </span>
                ) : null}
              </td>
              <td className={styles.colApply} onClick={(e) => e.stopPropagation()}>
                {!hasApplied && onApply && (
                  <ApplyForJob
                    vacancy={v}
                    onApply={onApply}
                    onApplied={(date) => rows.markApplied(v.id, date)}
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
