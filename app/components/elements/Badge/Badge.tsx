import type {Status} from "~/lib/schemas";
import styles from "./Badge.module.css";

const labels: Record<Status, string> = {
    nieuw: "Nieuw",
    bekeken: "Bekeken",
    gesolliciteerd: "Gesolliciteerd",
    afgewezen: "Afgewezen",
    "niet-interessant": "Niet interessant",
};

export function Badge({status}: { status: Status }) {
    return (
        <span className={`${styles.badge} ${styles[status.replace("-", "")]}`}>
      {labels[status]}
    </span>
    );
}
