import styles from "./CLink.module.css"

type Variant = "cta" | "extern";
type Props = {
    target?: string;
    url: string;
    variant: Variant;
    route: string;
    children?: React.ReactNode;
}

export function CLink({url, variant, target = "_self", route, children}: Props) {
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    console.log(path.startsWith(route));

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