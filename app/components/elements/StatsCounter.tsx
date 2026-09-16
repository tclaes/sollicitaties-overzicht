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
      <div className={`${styles.item} ${styles.new}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["new"] ?? 0}</span>
        <span className={styles.label}>Nieuw</span>
      </div>
      <div className={`${styles.item} ${styles.viewed}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["viewed"] ?? 0}</span>
        <span className={styles.label}>Bekeken</span>
      </div>
      <div className={`${styles.item} ${styles.applied}`}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["applied"] ?? 0}</span>
        <span className={styles.label}>Gesolliciteerd</span>
      </div>
      <div className={styles.item}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["not-interesting"] ?? 0}</span>
        <span className={styles.label}>Niet interessant</span>
      </div>
      <div className={styles.item}>
        <span className={styles.dot} />
        <span className={styles.count}>{counts["not-hired"] ?? 0}</span>
        <span className={styles.label}>Niet aangeworven</span>
      </div>
    </div>
  );
}
