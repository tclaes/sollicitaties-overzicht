import type { Vacature } from "~/lib/schemas";
import styles from "./StatsTeller.module.css";

export function StatsTeller({ vacatures }: { vacatures: Vacature[] }) {
  const telling = vacatures.reduce<Record<string, number>>(
    (acc, v) => ({ ...acc, [v.status]: (acc[v.status] ?? 0) + 1 }),
    {}
  );

  return (
    <div className={styles.strip}>
      <div className={styles.item}>
        <span className={styles.getal}>{vacatures.length}</span>
        <span className={styles.label}>Totaal</span>
      </div>
      <div className={`${styles.item} ${styles.nieuw}`}>
        <span className={styles.dot} />
        <span className={styles.getal}>{telling["nieuw"] ?? 0}</span>
        <span className={styles.label}>Nieuw</span>
      </div>
      <div className={`${styles.item} ${styles.bekeken}`}>
        <span className={styles.dot} />
        <span className={styles.getal}>{telling["bekeken"] ?? 0}</span>
        <span className={styles.label}>Bekeken</span>
      </div>
      <div className={`${styles.item} ${styles.gesolliciteerd}`}>
        <span className={styles.dot} />
        <span className={styles.getal}>{telling["gesolliciteerd"] ?? 0}</span>
        <span className={styles.label}>Gesolliciteerd</span>
      </div>
    </div>
  );
}
