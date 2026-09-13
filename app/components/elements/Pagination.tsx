import {PAGE_SIZE} from "~/lib/schemas";
import {buildSearchUrl} from "~/lib/searchParams";
import styles from "./Pagination.module.css";

interface Props {
  totalItems: number;
  currentPage: number;
  basePath: string;
  currentSearch: Record<string, unknown>;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];

  const addPage = (p: number) => {
    const last = pages[pages.length - 1];
    if (last === p) return;
    if (typeof last === "number" && last + 1 < p) {
      pages.push("ellipsis");
    }
    pages.push(p);
  };

  addPage(1);
  for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
    addPage(p);
  }
  addPage(totalPages);

  return pages;
}

export function Pagination({totalItems, currentPage, basePath, currentSearch}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const link = (page: number) => buildSearchUrl(basePath, currentSearch, {page});

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav className={styles.bar} aria-label="Paginatie">
      {currentPage > 1 && (
        <a href={link(currentPage - 1)} className={styles.arrow}>
          Vorige
        </a>
      )}

      <span className={styles.pages}>
        {pageNumbers.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} className={styles.ellipsis}>
              &hellip;
            </span>
          ) : p === currentPage ? (
            <span key={p} className={`${styles.page} ${styles.current}`}>
              {p}
            </span>
          ) : (
            <a key={p} href={link(p)} className={styles.page}>
              {p}
            </a>
          )
        )}
      </span>

      {currentPage < totalPages && (
        <a href={link(currentPage + 1)} className={styles.arrow}>
          Volgende
        </a>
      )}
    </nav>
  );
}