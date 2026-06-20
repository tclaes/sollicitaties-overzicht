import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <a href="/" className={styles.logo}>
        Sollicitaties
      </a>
    </header>
  );
}
