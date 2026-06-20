import type { Vacature, Status } from "~/lib/schemas";
import styles from "./StatsTeller.module.css";

const STATS: { status: Status; label: string }[] = [
  { status: "nieuw", label: "Nieuw" },
  { status: "bekeken", label: "Bekeken" },
  { status: "gesolliciteerd", label: "Gesolliciteerd" },
];

export function StatsTeller({ vacatures }: { vacatures: Vacature[] }) {
  const telling = vacatures.reduce<Record<string, number>>(
    (acc, v) => ({ ...acc, [v.status]: (acc[v.status] ?? 0) + 1 }),
    {}
  );

  return (
    <dl className={styles.lijst}>
      <div className={styles.item}>
        <dt className={styles.label}>Totaal</dt>
        <dd className={styles.waarde}>{vacatures.length}</dd>
      </div>
      {STATS.map(({ status, label }) => (
        <div key={status} className={`${styles.item} ${styles[status]}`}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.waarde}>{telling[status] ?? 0}</dd>
        </div>
      ))}
    </dl>
  );
}
