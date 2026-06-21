import styles from "./Nav.module.css";

export function Nav() {
  const huidigPad = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <nav className={styles.nav} aria-label="Navigatie">
      <div className={styles.sectie}>
        <span className={styles.sectieLabel}>Overzicht</span>
        <a
          href="/"
          className={`${styles.datumLink} ${huidigPad === "/" ? styles.actief : ""}`}
          aria-current={huidigPad === "/" ? "page" : undefined}
        >
          Vacatures
        </a>
        <a
          href="/sollicitaties"
          className={`${styles.datumLink} ${huidigPad === "/sollicitaties" ? styles.actief : ""}`}
          aria-current={huidigPad === "/sollicitaties" ? "page" : undefined}
        >
          Sollicitaties
        </a>
      </div>
    </nav>
  );
}
