import styles from "./Breadcrumb.module.css";

export function Breadcrumb({company}) {
  return (
    <nav className={styles.breadcrumb}>
      <a href="/">Dashboard</a>
      <span aria-hidden>›</span>
      <a href="/vacatures">Vacatures</a>
      <span aria-hidden>›</span>
      <span>{company}</span>
    </nav>
  )
}