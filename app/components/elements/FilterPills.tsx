import {ROLE_LABELS, RoleSchema, SourceSchema, StatusSchema} from "~/lib/schemas";
import styles from "./FilterPills.module.css";

interface Props {
  currentSearch: { status?: string; source?: string; functie?: string; sort?: string };
  basePath?: string;
}

const statusLabels: Record<string, string> = {
  nieuw: "Nieuw",
  bekeken: "Bekeken",
  gesolliciteerd: "Gesolliciteerd",
  afgewezen: "Afgewezen",
  "niet-interessant": "Niet interessant",
};

export function FilterPills({currentSearch, basePath = "/vacatures"}: Props) {
  function buildUrl(params: Record<string, string | undefined>) {
    const merged = {...currentSearch, ...params};
    const search = new URLSearchParams(
      Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== undefined) as [string, string][]
      )
    );
    return `${basePath}${search.size ? `?${search}` : ""}`;
  }

  return (
    <div className={styles.bar} role="group" aria-label="Filters">
      <span className={styles.groupLabel}>Status</span>
      <a
        href={buildUrl({status: undefined})}
        className={`${styles.pill} ${!currentSearch.status ? styles.active : ""}`}
      >
        Alle
      </a>
      {StatusSchema.options
        .filter((s) => s !== "afgewezen")
        .map((status) => (
          <a
            key={status}
            href={buildUrl({status})}
            className={`${styles.pill} ${currentSearch.status === status ? styles.active : ""}`}
          >
            {statusLabels[status]}
          </a>
        ))}

      <span className={styles.divider}/>

      <span className={styles.groupLabel}>Functie</span>
      <a
        href={buildUrl({functie: undefined})}
        className={`${styles.pill} ${!currentSearch.functie ? styles.active : ""}`}
      >
        Alle
      </a>
      {RoleSchema.options.map((role) => (
        <a
          key={role}
          href={buildUrl({functie: role})}
          className={`${styles.pill} ${currentSearch.functie === role ? styles.active : ""}`}
        >
          {ROLE_LABELS[role]}
        </a>
      ))}

      <span className={styles.divider}/>

      <span className={styles.groupLabel}>Sortering</span>
      {(["match", "datum", "titel"] as const).map((option) => {
        const active = (currentSearch.sort ?? "match") === option;
        const labels = {match: "Match", datum: "Datum", titel: "Titel"};
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
          {source}
        </a>
      ))}
    </div>
  );
}
