import styles from "./Nav.module.css";

export function Nav() {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <nav className={styles.nav} aria-label="Navigatie">
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Overzicht</span>
        <a
          href="/"
          className={`${styles.navLink} ${currentPath === "/" ? styles.active : ""}`}
          aria-current={currentPath === "/" ? "page" : undefined}
        >
          Vacatures
        </a>
        <a
          href="/sollicitaties"
          className={`${styles.navLink} ${currentPath === "/sollicitaties" ? styles.active : ""}`}
          aria-current={currentPath === "/sollicitaties" ? "page" : undefined}
        >
          Sollicitaties
        </a>
      </div>
    </nav>
  );
}
