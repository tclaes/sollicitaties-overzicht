import { SOURCE_LABELS, type Source } from "~/lib/schemas";
import styles from "./SourceBadge.module.css";

const SOURCE_CSS_CLASS: Record<Source, string> = {
  indeed: "indeed",
  vdab: "vdab",
  jobat: "jobat",
  linkedin: "linkedin",
  other: "andere",
};

export function SourceBadge({ source }: { source: Source }) {
  return <span className={`${styles.badge} ${styles[SOURCE_CSS_CLASS[source]]}`}>{SOURCE_LABELS[source]}</span>;
}
