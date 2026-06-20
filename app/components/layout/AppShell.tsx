import type { ReactNode } from "react";
import { Header } from "./Header";
import { Nav } from "./Nav";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
