import styles from "./Nav.module.css";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vacatures", label: "Alle vacatures" },
];

export function Nav() {
  const huidigPad =
    typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <nav className={styles.nav} aria-label="Hoofdnavigatie">
      <ul className={styles.lijst}>
        {links.map(({ href, label }) => (
          <li key={href}>
            <a
              href={href}
              className={`${styles.link} ${huidigPad === href ? styles.actief : ""}`}
              aria-current={huidigPad === href ? "page" : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
