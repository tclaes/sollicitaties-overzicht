import styles from "./Nav.module.css";

export function Nav() {
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <nav className={styles.nav} aria-label="Navigatie">
      <div className={styles.sectie}>
        <span className={styles.sectieLabel}>Overzicht</span>
        <a
          href="/"
          className={`${styles.datumLink} ${currentPath === "/" ? styles.actief : ""}`}
          aria-current={currentPath === "/" ? "page" : undefined}
        >
          Vacatures
        </a>
        <a
          href="/sollicitaties"
          className={`${styles.datumLink} ${currentPath === "/sollicitaties" ? styles.actief : ""}`}
          aria-current={currentPath === "/sollicitaties" ? "page" : undefined}
        >
          Sollicitaties
        </a>
      </div>
    </nav>
  );
}
