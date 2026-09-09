import {logout} from "~/lib/auth";
import styles from "./Header.module.css";
import {CLink} from "../elements/Link/CLink"

export function Header() {
    return (
        <header className={styles.header}>
            <a href="/" className={styles.logo}>
                Sollicitaties
            </a>
            <nav className={styles.nav} aria-label="Hoofdnavigatie">
                <CLink url={"/vacatures"} variant={"external"} route={"/vacatures"}>Alle vacatures</CLink>
            </nav>
            <button className={styles.logout} onClick={() => logout()}>Uitloggen</button>
        </header>
    );
}
