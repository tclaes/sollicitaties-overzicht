import type { Bron } from "~/lib/schemas";
import styles from "./BronBadge.module.css";

export function BronBadge({ bron }: { bron: Bron }) {
  return <span className={`${styles.badge} ${styles[bron]}`}>{bron}</span>;
}
