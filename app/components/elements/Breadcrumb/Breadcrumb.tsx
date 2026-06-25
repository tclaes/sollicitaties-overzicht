import styles from "./Breadcrumb.module.css";
import {capitalize, path} from "~/lib/utils"

export function Breadcrumb({company}: { company: string }) {
  const pathName = capitalize(path.split("/"))


  return (
    <nav className={styles.breadcrumb}>
      <a href="/">Dashboard</a>
      <span aria-hidden>›</span>
      {path ? (
        <>
          <a href={`/${path}`}>{pathName}</a>
          <span aria-hidden>›</span>
        </>
      ) : null}
      <span>{company}</span>
    </nav>
  )
}