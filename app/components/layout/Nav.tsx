import type {Ref} from "react";
import styles from "./Nav.module.css";

interface Props {
  id?: string;
  navRef?: Ref<HTMLElement>;
  open?: boolean;
  onNavigate?: () => void;
}

export function Nav({id, navRef, open = false, onNavigate}: Props) {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/vacatures";
  const onVacancies = currentPath === "/" || currentPath.startsWith("/vacatures");
  const onApplications = currentPath.startsWith("/sollicitaties");

  return (
    <nav id={id} ref={navRef} className={`${styles.nav} ${open ? styles.open : ""}`} aria-label="Navigatie">
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Overzicht</span>
        <a
          href="/vacatures"
          className={`${styles.navLink} ${onVacancies ? styles.active : ""}`}
          aria-current={onVacancies ? "page" : undefined}
          onClick={onNavigate}
        >
          Vacatures
        </a>
        <a
          href="/sollicitaties"
          className={`${styles.navLink} ${onApplications ? styles.active : ""}`}
          aria-current={onApplications ? "page" : undefined}
          onClick={onNavigate}
        >
          Sollicitaties
        </a>
      </div>
    </nav>
  );
}
