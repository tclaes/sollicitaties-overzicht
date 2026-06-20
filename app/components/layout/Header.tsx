import styles from "./Header.module.css";

export function Header() {
  const pad = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <header className={styles.header}>
      <a href="/" className={styles.logo}>
        Sollicitaties
      </a>
      <nav className={styles.nav} aria-label="Hoofdnavigatie">
        <a
          href="/"
          className={`${styles.link} ${pad === "/" ? styles.actief : ""}`}
          aria-current={pad === "/" ? "page" : undefined}
        >
          Dashboard
        </a>
        <a
          href="/vacatures"
          className={`${styles.link} ${pad.startsWith("/vacatures") ? styles.actief : ""}`}
          aria-current={pad.startsWith("/vacatures") ? "page" : undefined}
        >
          Alle vacatures
        </a>
      </nav>
    </header>
  );
}
