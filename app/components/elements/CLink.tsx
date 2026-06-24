import styles from "./CLink.module.css"

type Variant = "cta" | "extern";
type Props = {
    url: string;
    variant: Variant;
    target?: string;
    children?: React.ReactNode;
}

export function CLink({url, variant, target = "_blank", children}: Props) {
    return (
        <a
            href={url}
            target={`${target}`}
            rel="noopener noreferrer"
            className={`${styles.link} ${styles[variant]} link`}
        >
            {children}
        </a>
    )
}