import type { Vacature } from "~/lib/schemas";
import { StatusBadge } from "./StatusBadge";
import { BronBadge } from "./BronBadge";
import styles from "./VacatureTabel.module.css";

interface Props {
  vacatures: Vacature[];
}

export function VacatureTabel({ vacatures }: Props) {
  if (vacatures.length === 0) {
    return <div className={styles.leeg}>Geen vacatures gevonden.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.tabel}>
        <thead>
          <tr>
            <th className={styles.colStatus}>Status</th>
            <th className={styles.colBron}>Bron</th>
            <th>Functie</th>
            <th className={styles.colTags}>Tags</th>
            <th className={styles.colLocatie}>Locatie</th>
            <th className={styles.colMatch}>Match</th>
            <th className={styles.colActie} aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {vacatures.map((v) => (
            <tr
              key={v.id}
              className={styles.rij}
              onClick={() => { window.location.href = `/vacatures/${v.id}`; }}
            >
              <td>
                <StatusBadge status={v.status} />
              </td>
              <td>
                <BronBadge bron={v.bron} />
              </td>
              <td className={styles.functieCol}>
                <span className={styles.titel}>{v.titel}</span>
                <span className={styles.bedrijf}>{v.bedrijf}</span>
              </td>
              <td>
                <ul className={styles.tags} aria-label="Tags">
                  {v.tags.slice(0, 3).map((tag) => (
                    <li key={tag} className={styles.tag}>{tag}</li>
                  ))}
                </ul>
              </td>
              <td className={styles.locatie}>{v.locatie.split(",")[0]}</td>
              <td>
                {v.match ? (
                  <span className={`${styles.matchBadge} ${styles[`match_${v.match.score}`]}`} title={v.match.toelichting}>
                    {v.match.score}
                  </span>
                ) : null}
              </td>
              <td className={styles.actie} aria-hidden="true">›</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
