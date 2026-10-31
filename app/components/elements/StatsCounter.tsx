import { useEffect, useRef } from "react";
import type { VacancyCounts } from "~/lib/vacancies";
import { buildSearchUrl } from "~/lib/searchParams";
import styles from "./StatsCounter.module.css";

interface Props {
  counts: VacancyCounts;
  currentSearch: { status?: string };
  basePath?: string;
}

const items: { key: keyof VacancyCounts; status?: string; label: string; className?: string; dot: boolean }[] = [
  { key: "total", status: undefined, label: "Totaal", dot: false },
  { key: "new", status: "new", label: "Nieuw", className: styles.new, dot: true },
  { key: "viewed", status: "viewed", label: "Bekeken", className: styles.viewed, dot: true },
  { key: "applied", status: "applied", label: "Gesolliciteerd", className: styles.applied, dot: true },
  { key: "not-interesting", status: "not-interesting", label: "Niet interessant", dot: true },
  { key: "not-hired", status: "not-hired", label: "Niet aangeworven", dot: true },
];

export function StatsCounter({ counts, currentSearch, basePath = "/vacatures" }: Props) {
  const stripRef = useRef<HTMLElement>(null);

  // Op smalle schermen scrolt de strip horizontaal: houd de actieve status in beeld.
  useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [currentSearch.status]);

  return (
    <nav ref={stripRef} className={styles.strip} aria-label="Status">
      {items.map(({ key, status, label, className, dot }) => {
        const active = currentSearch.status === status;
        return (
          <a
            key={key}
            href={buildSearchUrl(basePath, currentSearch, { status })}
            className={`${styles.item} ${className ?? ""} ${active ? styles.active : ""}`}
            aria-current={active ? "true" : undefined}
          >
            {dot && <span className={styles.dot} />}
            <span className={styles.count}>{counts[key]}</span>
            <span className={styles.label}>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
