import type { ReactNode } from "react";
import { Header } from "./Header";
import { Nav } from "./Nav";
import styles from "./AppShell.module.css";

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
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
