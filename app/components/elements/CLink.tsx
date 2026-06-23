import styles from "./CLink.module.css"

export function CLink({url, variant, target = "_blank", children}: any) {
    return (
        <a
            href={url}
            target={`${target}`}
            rel="noopener noreferrer"
            className={`${styles.button} ${styles[variant]} link`}
        >
            {children}
        </a>
    )
}