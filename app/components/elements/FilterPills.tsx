import {ROLE_LABELS, RoleSchema, SOURCE_LABELS, SourceSchema} from "~/lib/schemas";
import {buildSearchUrl} from "~/lib/searchParams";
import styles from "./FilterPills.module.css";

interface Props {
  currentSearch: { status?: string; source?: string; function?: string; sort?: string };
  basePath?: string;
}

export function FilterPills({currentSearch, basePath = "/vacatures"}: Props) {
  function buildUrl(params: Record<string, string | undefined>) {
    return buildSearchUrl(basePath, currentSearch, params);
  }

  return (
    <div className={styles.bar} role="group" aria-label="Filters">
      <span className={styles.groupLabel}>Functie</span>
      <a
        href={buildUrl({function: undefined})}
        className={`${styles.pill} ${!currentSearch.function ? styles.active : ""}`}
      >
        Alle
      </a>
      {RoleSchema.options.map((role) => (
        <a
          key={role}
          href={buildUrl({function: role})}
          className={`${styles.pill} ${currentSearch.function === role ? styles.active : ""}`}
        >
          {ROLE_LABELS[role]}
        </a>
      ))}

      <span className={styles.divider}/>

      <span className={styles.groupLabel}>Sortering</span>
      {(["match", "date", "title"] as const).map((option) => {
        const active = (currentSearch.sort ?? "match") === option;
        const labels = {match: "Match", date: "Datum", title: "Titel"};
        return (
          <a
            key={option}
            href={buildUrl({sort: option})}
            className={`${styles.pill} ${active ? styles.active : ""}`}
          >
            {labels[option]}
          </a>
        );
      })}

      <span className={styles.divider}/>

      <span className={styles.groupLabel}>Bron</span>
      <a
        href={buildUrl({source: undefined})}
        className={`${styles.pill} ${!currentSearch.source ? styles.active : ""}`}
      >
        Alle
      </a>
      {SourceSchema.options.map((source) => (
        <a
          key={source}
          href={buildUrl({source})}
          className={`${styles.pill} ${currentSearch.source === source ? styles.active : ""}`}
        >
          {SOURCE_LABELS[source]}
        </a>
      ))}
    </div>
  );
}
