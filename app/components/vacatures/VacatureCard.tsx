import type { Vacature } from "~/lib/schemas";
import { StatusBadge } from "./StatusBadge";
import { BronBadge } from "./BronBadge";
import styles from "./VacatureCard.module.css";

export function VacatureCard({ vacature }: { vacature: Vacature }) {
  return (
    <article className={styles.card}>
      <div className={styles.badges}>
        <StatusBadge status={vacature.status} />
        <BronBadge bron={vacature.bron} />
      </div>

      <div className={styles.body}>
        <h3 className={styles.titel}>
          <a href={`/vacatures/${vacature.id}`} className={styles.titelLink}>
            {vacature.titel}
          </a>
        </h3>
        <p className={styles.bedrijf}>{vacature.bedrijf}</p>
        <p className={styles.locatie}>{vacature.locatie}</p>
      </div>

      {vacature.tags.length > 0 && (
        <ul className={styles.tags} aria-label="Tags">
          {vacature.tags.slice(0, 4).map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}

      <footer className={styles.footer}>
        <a
          href={vacature.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.extern}
        >
          Bekijk →
        </a>
      </footer>
    </article>
  );
}
