import { SourceSchema, StatusSchema } from "~/lib/schemas";
import styles from "./FilterPills.module.css";

interface Props {
  currentSearch: { status?: string; source?: string; sort?: string };
  basePad?: string;
}

const statusLabels: Record<string, string> = {
  nieuw: "Nieuw",
  bekeken: "Bekeken",
  gesolliciteerd: "Gesolliciteerd",
  afgewezen: "Afgewezen",
  "niet-interessant": "Niet interessant",
};

export function FilterPills({ currentSearch, basePad = "/vacatures" }: Props) {
  function buildUrl(params: Record<string, string | undefined>) {
    const merged = { ...currentSearch, ...params };
    const search = new URLSearchParams(
      Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== undefined) as [string, string][]
      )
    );
    return `${basePad}${search.size ? `?${search}` : ""}`;
  }

  return (
    <div className={styles.bar} role="group" aria-label="Filters">
      <span className={styles.groepLabel}>Status</span>
      <a
        href={buildUrl({ status: undefined })}
        className={`${styles.pill} ${!currentSearch.status ? styles.actief : ""}`}
      >
        Alle
      </a>
      {StatusSchema.options
        .filter((s) => s !== "afgewezen")
        .map((status) => (
          <a
            key={status}
            href={buildUrl({ status })}
            className={`${styles.pill} ${currentSearch.status === status ? styles.actief : ""}`}
          >
            {statusLabels[status]}
          </a>
        ))}

      <span className={styles.scheiding} />

      <span className={styles.groepLabel}>Sortering</span>
      {(["match", "datum", "titel"] as const).map((optie) => {
        const actief = (currentSearch.sort ?? "match") === optie;
        const labels = { match: "Match", datum: "Datum", titel: "Titel" };
        return (
          <a
            key={optie}
            href={buildUrl({ sorteer: optie })}
            className={`${styles.pill} ${actief ? styles.actief : ""}`}
          >
            {labels[optie]}
          </a>
        );
      })}

      <span className={styles.scheiding} />

      <span className={styles.groepLabel}>Bron</span>
      <a
        href={buildUrl({ bron: undefined })}
        className={`${styles.pill} ${!currentSearch.source ? styles.actief : ""}`}
      >
        Alle
      </a>
      {SourceSchema.options.map((bron) => (
        <a
          key={bron}
          href={buildUrl({ bron })}
          className={`${styles.pill} ${currentSearch.source === bron ? styles.actief : ""}`}
        >
          {bron}
        </a>
      ))}
    </div>
  );
}
