import type {Ref} from "react";
import {logout} from "~/lib/auth";
import styles from "./Header.module.css";

interface Props {
  navId: string;
  navOpen: boolean;
  menuButtonRef?: Ref<HTMLButtonElement>;
  onToggleNav: () => void;
}

export function Header({navId, navOpen, menuButtonRef, onToggleNav}: Props) {
  return (
    <header className={styles.header}>
      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menuButton}
        aria-label="Menu"
        aria-controls={navId}
        aria-expanded={navOpen}
        onClick={onToggleNav}
      >
        <span className={styles.menuIcon} aria-hidden="true"/>
      </button>
      <a href="/vacatures" className={styles.logo}>
        Sollicitaties
      </a>
      <button className={styles.logout} onClick={() => logout()}>Uitloggen</button>
    </header>
  );
}
