import { formatDatumSidebar } from "~/lib/date";
import styles from "./Nav.module.css";

interface Props {
  datums: string[];
}

export function Nav({ datums }: Props) {
  const vandaag = new Date().toISOString().slice(0, 10);
  const eerder = datums.filter((d) => d !== vandaag).slice(0, 10);
  const heeftVandaag = datums.includes(vandaag);
  const huidigPad = typeof window !== "undefined" ? window.location.pathname : "/";
  const huidigSearch = typeof window !== "undefined" ? window.location.search : "";

  return (
    <nav className={styles.nav} aria-label="Datum navigatie">
      <div className={styles.sectie}>
        <span className={styles.sectieLabel}>Overzicht</span>
        <a
          href="/"
          className={`${styles.datumLink} ${huidigPad === "/" ? styles.actief : ""}`}
          aria-current={huidigPad === "/" ? "page" : undefined}
        >
          {formatDatumSidebar(vandaag)}
          {heeftVandaag && <span className={styles.dot} />}
        </a>
        <a
          href="/sollicitaties"
          className={`${styles.datumLink} ${huidigPad === "/sollicitaties" ? styles.actief : ""}`}
          aria-current={huidigPad === "/sollicitaties" ? "page" : undefined}
        >
          Sollicitaties
        </a>
      </div>

      {eerder.length > 0 && (
        <div className={styles.sectie}>
          <span className={styles.sectieLabel}>Eerder</span>
          {eerder.map((datum) => {
            const isActief =
              huidigPad.startsWith("/vacatures") &&
              huidigSearch.includes(`datum=${datum}`);
            return (
              <a
                key={datum}
                href={`/vacatures?datum=${datum}`}
                className={`${styles.datumLink} ${isActief ? styles.actief : ""}`}
                aria-current={isActief ? "page" : undefined}
              >
                {formatDatumSidebar(datum)}
              </a>
            );
          })}
        </div>
      )}
    </nav>
  );
}
