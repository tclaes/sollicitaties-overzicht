import type { Sollicitatie } from "~/lib/schemas";
import styles from "./SollicitatiesPanel.module.css";

const STATUS_LABELS: Record<Sollicitatie["status"], string> = {
  gesolliciteerd: "wacht",
  in_gesprek: "in gesprek",
  afgewezen: "afgewezen",
  niet_wervend: "niet wervend",
  geen_reactie: "geen reactie",
  aangenomen: "aangenomen",
};

interface Props {
  sollicitaties: Sollicitatie[];
}

export function SollicitatiesPanel({ sollicitaties }: Props) {
  const gesorteerd = [...sollicitaties].sort(
    (a, b) => b.gesolliceerdOp.localeCompare(a.gesolliceerdOp)
  );

  const actief = gesorteerd.filter(
    (s) => s.status === "gesolliciteerd" || s.status === "in_gesprek"
  );
  const overig = gesorteerd.filter(
    (s) => s.status !== "gesolliciteerd" && s.status !== "in_gesprek"
  );

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.titel}>Sollicitaties</span>
        <span className={styles.teller}>{sollicitaties.length} totaal</span>
      </div>
      <div className={styles.lijstWrapper}>
        <table className={styles.tabel}>
          <tbody>
            {gesorteerd.map((s) => (
              <tr key={s.id} className={styles.rij} title={s.notitie}>
                <td className={styles.datum}>
                  {new Date(s.gesolliceerdOp).toLocaleDateString("nl-BE", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
                <td className={styles.bedrijf}>{s.bedrijf}</td>
                <td className={styles.rol}>{s.rol}</td>
                <td>
                  <span className={`${styles.badge} ${styles[`status_${s.status}`]}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
