import type { Vacature } from "~/lib/schemas";
import { VacatureCard } from "./VacatureCard";
import styles from "./VacatureList.module.css";

interface Props {
  vacatures: Vacature[];
  datum?: string;
}

export function VacatureList({ vacatures }: Props) {
  if (vacatures.length === 0) {
    return (
      <div className={styles.leeg}>
        <p>Geen vacatures gevonden.</p>
      </div>
    );
  }

  return (
    <ul className={styles.lijst}>
      {vacatures.map((vacature) => (
        <li key={vacature.id}>
          <VacatureCard vacature={vacature} />
        </li>
      ))}
    </ul>
  );
}
