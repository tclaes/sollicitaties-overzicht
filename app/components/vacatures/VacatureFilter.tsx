import { StatusSchema, RegioSchema, BronSchema } from "~/lib/schemas";
import styles from "./VacatureFilter.module.css";

interface Props {
  huidigSearch: {
    status?: string;
    regio?: string;
    bron?: string;
  };
}

export function VacatureFilter({ huidigSearch }: Props) {
  function buildUrl(params: Record<string, string | undefined>) {
    const search = new URLSearchParams(
      Object.fromEntries(
        Object.entries({ ...huidigSearch, ...params }).filter(
          ([, v]) => v !== undefined
        ) as [string, string][]
      )
    );
    return `/vacatures${search.size ? `?${search}` : ""}`;
  }

  return (
    <div className={styles.filter} role="search" aria-label="Filter vacatures">
      <div className={styles.groep}>
        <span className={styles.label}>Status</span>
        <div className={styles.knoppen}>
          <a
            href={buildUrl({ status: undefined })}
            className={`${styles.knop} ${!huidigSearch.status ? styles.actief : ""}`}
          >
            Alle
          </a>
          {StatusSchema.options.map((status) => (
            <a
              key={status}
              href={buildUrl({ status })}
              className={`${styles.knop} ${huidigSearch.status === status ? styles.actief : ""}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.groep}>
        <span className={styles.label}>Regio</span>
        <div className={styles.knoppen}>
          <a
            href={buildUrl({ regio: undefined })}
            className={`${styles.knop} ${!huidigSearch.regio ? styles.actief : ""}`}
          >
            Alle
          </a>
          {RegioSchema.options.map((regio) => (
            <a
              key={regio}
              href={buildUrl({ regio })}
              className={`${styles.knop} ${huidigSearch.regio === regio ? styles.actief : ""}`}
            >
              {regio.charAt(0).toUpperCase() + regio.slice(1)}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.groep}>
        <span className={styles.label}>Bron</span>
        <div className={styles.knoppen}>
          <a
            href={buildUrl({ bron: undefined })}
            className={`${styles.knop} ${!huidigSearch.bron ? styles.actief : ""}`}
          >
            Alle
          </a>
          {BronSchema.options.map((bron) => (
            <a
              key={bron}
              href={buildUrl({ bron })}
              className={`${styles.knop} ${huidigSearch.bron === bron ? styles.actief : ""}`}
            >
              {bron.charAt(0).toUpperCase() + bron.slice(1)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
