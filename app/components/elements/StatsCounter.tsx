import type { Vacancy } from "~/lib/schemas";
import styles from "./StatsCounter.module.css";

export function StatsCounter({ vacancies }: { vacancies: Vacancy[] }) {
  const counts = vacancies.reduce<Record<string, number>>(
    (acc, v) => ({ ...acc, [v.status]: (acc[v.status] ?? 0) + 1 }),
    {}
  );

  return (
    <div className={styles.strip}>
      <div className={styles.item}>
        <span className={styles.count}>{vacancies.length}</span>
        <span className={styles.label}>Totaal</span>
      </div>
      <div className={`${styles.item} ${styles.nieuw}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["nieuw"] ?? 0}</span>
        <span className={styles.label}>Nieuw</span>
      </div>
      <div className={`${styles.item} ${styles.bekeken}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["bekeken"] ?? 0}</span>
        <span className={styles.label}>Bekeken</span>
      </div>
      <div className={`${styles.item} ${styles.gesolliciteerd}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["gesolliciteerd"] ?? 0}</span>
        <span className={styles.label}>Gesolliciteerd</span>
      </div>
      <div className={styles.item}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["niet-interessant"] ?? 0}</span>
        <span className={styles.label}>Niet interessant</span>
      </div>
    </div>
  );
}
