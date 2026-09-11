import type {Status} from "~/lib/schemas";
import styles from "./Badge.module.css";

const labels: Record<Status, string> = {
    new: "Nieuw",
    viewed: "Bekeken",
    applied: "Gesolliciteerd",
    rejected: "Afgewezen",
    "not-interesting": "Niet interessant",
};

const cssClass: Record<Status, string> = {
    new: "nieuw",
    viewed: "bekeken",
    applied: "gesolliciteerd",
    rejected: "afgewezen",
    "not-interesting": "nietinteressant",
};

export function Badge({status}: { status: Status }) {
    return (
        <span className={`${styles.badge} ${styles[cssClass[status]]}`}>
      {labels[status]}
    </span>
    );
}
