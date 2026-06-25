import styles from "./CLink.module.css"
import path from "~/lib/utils"

type Variant = "cta" | "extern";
type Target = "_blank" | "_self" | "_parent" | "_top";
type Props = {
  target?: string;
  url: string;
  variant: Variant;
  route: string;
  children?: React.ReactNode;
}

export function CLink({url, variant, target = "_self", route, children}: Props) {

  return (
    <a
      href={url}
      target={`${target}`}
      rel="noopener noreferrer"
      className={`link ${styles.link} ${styles[variant]} ${path.startsWith(route) ? styles.actief : ""}`}
      aria-current={path.startsWith(route) ? "page" : undefined}
    >
      {children}
    </a>
  )
}