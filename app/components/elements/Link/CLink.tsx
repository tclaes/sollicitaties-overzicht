import styles from "./CLink.module.css"

type Variant = "default" | "cta" | "extern";
type Target = "_blank" | "_self" | "_parent" | "_top";
type Props = {
  target?: Target;
  url: string;
  variant?: Variant;
  route?: string;
  children?: React.ReactNode;
}

export function CLink({url, variant = "default", target = "_self", route = '', children}: Props) {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <a
      href={url}
      target={`${target}`}
      rel="noopener noreferrer"
      className={`link ${styles.link} ${styles[variant]} ${path.startsWith(route) ? styles.actief : ""}`}
      aria-current={route && path.startsWith(route) ? "page" : undefined}
    >
      {children}
    </a>
  )
}
