import {logout} from "~/lib/auth";
import styles from "./Header.module.css";

export function Header() {
    return (
        <header className={styles.header}>
            <a href="/vacatures" className={styles.logo}>
                Sollicitaties
            </a>
            <button className={styles.logout} onClick={() => logout()}>Uitloggen</button>
        </header>
    );
}
