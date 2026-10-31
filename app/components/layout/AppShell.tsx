import {useEffect, useRef, useState} from "react";
import type {ReactNode} from "react";
import {Header} from "./Header";
import {Nav} from "./Nav";
import styles from "./AppShell.module.css";

interface Props {
  children: ReactNode;
}

export const NAV_ID = "hoofdnavigatie";

export function AppShell({children}: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (navOpen) {
      wasOpen.current = true;
      navRef.current?.querySelector<HTMLElement>("a")?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return (
    <div className={styles.shell}>
      <Header
        navId={NAV_ID}
        navOpen={navOpen}
        menuButtonRef={menuButtonRef}
        onToggleNav={() => setNavOpen((open) => !open)}
      />
      <div className={styles.body}>
        <Nav id={NAV_ID} navRef={navRef} open={navOpen} onNavigate={() => setNavOpen(false)}/>
        {navOpen && <div className={styles.backdrop} data-testid="nav-backdrop" onClick={() => setNavOpen(false)}/>}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
