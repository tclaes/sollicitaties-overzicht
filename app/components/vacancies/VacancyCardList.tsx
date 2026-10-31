import type {Application, Vacancy} from "~/lib/schemas";
import {MATCH_SCORE_LABELS, ROLE_LABELS} from "~/lib/schemas";
import {SourceBadge} from "../elements/SourceBadge";
import {Badge} from "../elements/Badge/Badge";
import {FavoriteButton} from "../elements/FavoriteButton/FavoriteButton";
import {ApplyForJob} from "./ApplyForJob/ApplyForJob";
import {ApplicationStatus} from "./ApplicationStatus/ApplicationStatus";
import {useVacancyRows} from "./useVacancyRows";
import styles from "./VacancyCardList.module.css";

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
    appliedOn: string;
  }) => Promise<void>;
}

/** Kaartweergave van de vacaturelijst voor telefoon en tablet; zelfde acties als `VacancyTable`. */
export function VacancyCardList({vacancies, applicationById = new Map(), onApply}: Props) {
  const rows = useVacancyRows(applicationById);

  if (vacancies.length === 0) {
    return <div className={styles.empty}>Geen vacatures gevonden.</div>;
  }

  return (
    <ul className={styles.list} aria-label="Vacatures">
      {vacancies.map((v) => {
        const {application, hasApplied, effectiveStatus, date, isFavorite} = rows.getRow(v);

        return (
          <li
            key={v.id}
            className={styles.card}
            data-testid="vacancy-card"
            onClick={() => rows.openVacancy(v.id)}
          >
            <div className={styles.top}>
              <div className={styles.favorite} onClick={(e) => e.stopPropagation()}>
                <FavoriteButton
                  id={v.id}
                  favorite={isFavorite}
                  onToggled={(next) => rows.setFavorite(v.id, next)}
                />
              </div>
              <div className={styles.heading}>
                <span className={styles.title}>
                  {v.title}
                  {v.function && (
                    <span className={`${styles.roleBadge} ${styles[`role_${v.function}`]}`}>
                      {ROLE_LABELS[v.function]}
                    </span>
                  )}
                </span>
                <span className={styles.company}>{v.company}</span>
              </div>
              <SourceBadge source={v.source}/>
            </div>

            <div className={styles.meta}>
              <div className={styles.status} onClick={(e) => application && e.stopPropagation()}>
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
                {hasApplied && date && <span className={styles.applicationDate}>{date}</span>}
              </div>
              <span className={styles.location}>{v.location.split(",")[0]}</span>
              {v.match ? (
                <span
                  className={`${styles.matchBadge} ${styles[MATCH_SCORE_CSS_CLASS[v.match.score]]}`}
                  title={v.match.explanation}
                >
                  {MATCH_SCORE_LABELS[v.match.score]}
                </span>
              ) : null}
            </div>

            {v.tags.length > 0 && (
              <ul className={styles.tags} aria-label="Tags">
                {v.tags.slice(0, 3).map((tag) => (
                  <li key={tag} className={styles.tag}>{tag}</li>
                ))}
              </ul>
            )}

            {!hasApplied && onApply && (
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <ApplyForJob
                  vacancy={v}
                  onApply={onApply}
                  onApplied={(appliedOn) => rows.markApplied(v.id, appliedOn)}
                  alwaysVisible
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
