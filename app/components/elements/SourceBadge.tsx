import type { Source } from "~/lib/schemas";
import styles from "./SourceBadge.module.css";

export function SourceBadge({ source }: { source: Source }) {
  return <span className={`${styles.badge} ${styles[source]}`}>{source}</span>;
}
