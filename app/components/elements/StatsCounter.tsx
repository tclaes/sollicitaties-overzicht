import type { VacancyCounts } from "~/lib/vacancies";
import styles from "./StatsCounter.module.css";

export function StatsCounter({ counts }: { counts: VacancyCounts }) {
  return (
    <div className={styles.strip}>
      <div className={styles.item}>
        <span className={styles.count}>{counts.total}</span>
        <span className={styles.label}>Totaal</span>
      </div>
      <div className={`${styles.item} ${styles.new}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["new"]}</span>
        <span className={styles.label}>Nieuw</span>
      </div>
      <div className={`${styles.item} ${styles.viewed}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["viewed"]}</span>
        <span className={styles.label}>Bekeken</span>
      </div>
      <div className={`${styles.item} ${styles.applied}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["applied"]}</span>
        <span className={styles.label}>Gesolliciteerd</span>
      </div>
      <div className={styles.item}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["not-interesting"]}</span>
        <span className={styles.label}>Niet interessant</span>
      </div>
      <div className={styles.item}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["not-hired"]}</span>
        <span className={styles.label}>Niet aangeworven</span>
      </div>
    </div>
  );
}
