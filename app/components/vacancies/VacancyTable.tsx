import {useState} from "react";
import type {Application, ApplicationStatus as ApplicationStatusValue, Vacancy} from "~/lib/schemas";
import {MATCH_SCORE_LABELS, ROLE_LABELS} from "~/lib/schemas";
import {SourceBadge} from "../elements/SourceBadge";
import {Badge} from "../elements/Badge/Badge"
import {FavoriteButton} from "../elements/FavoriteButton/FavoriteButton";
import {ApplyForJob} from "./ApplyForJob/ApplyForJob";
import {ApplicationStatus} from "./ApplicationStatus/ApplicationStatus";
import styles from "./VacancyTable.module.css";
import {useNavigate, useRouter} from '@tanstack/react-router'

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
  const [locallyApplied, setLocallyApplied] = useState<Record<string, string>>({});
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ApplicationStatusValue>>({});
  const navigate = useNavigate();
  const router = useRouter();


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
          const application = applicationById.get(v.id);
          const localDate = locallyApplied[v.id];
          const hasApplied = !!application || !!localDate;
          const effectiveStatus = application ? statusOverrides[application.id] ?? application.status : null;
          const date = application?.appliedOn ?? localDate;
          const isFavorite = favoriteOverrides[v.id] ?? v.favorite ?? false;

          return (
            <tr
              key={v.id}
              className={`${styles.row} vacancy-row`}
              onClick={async () => {
                await navigate({to: `/vacatures/${v.id}`})
              }}
            >
              <td className={styles.colFavorite} onClick={(e) => e.stopPropagation()}>
                <FavoriteButton
                  id={v.id}
                  favorite={isFavorite}
                  onToggled={(next) =>
                    setFavoriteOverrides((prev) => ({...prev, [v.id]: next}))
                  }
                />
              </td>
              <td onClick={(e) => application && e.stopPropagation()}>
                {application && effectiveStatus ? (
                  <ApplicationStatus
                    applicationId={application.id}
                    vacancyId={v.id}
                    status={effectiveStatus}
                    onChanged={(next) => {
                      setStatusOverrides((prev) => ({...prev, [application.id]: next}));
                      if (next === "not_hired") void router.invalidate();
                    }}
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
