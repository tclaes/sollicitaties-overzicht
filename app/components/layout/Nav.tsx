import styles from "./Nav.module.css";

export function Nav() {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/vacatures";
  const onVacancies = currentPath === "/" || currentPath.startsWith("/vacatures");
  const onApplications = currentPath.startsWith("/sollicitaties");

  return (
    <nav className={styles.nav} aria-label="Navigatie">
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Overzicht</span>
        <a
          href="/vacatures"
          className={`${styles.navLink} ${onVacancies ? styles.active : ""}`}
          aria-current={onVacancies ? "page" : undefined}
        >
          Vacatures
        </a>
        <a
          href="/sollicitaties"
          className={`${styles.navLink} ${onApplications ? styles.active : ""}`}
          aria-current={onApplications ? "page" : undefined}
        >
          Sollicitaties
        </a>
      </div>
    </nav>
  );
}
