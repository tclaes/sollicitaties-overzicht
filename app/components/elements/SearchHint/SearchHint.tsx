import styles from "./SearchHint.module.css";

interface Props {
  query: string;
  archivedCount: number;
  outsideFiltersCount: number;
  onIncludeArchived: () => void;
  onClearFilters: () => void;
}

const vacancies = (count: number) => (count === 1 ? "1 vacature matcht" : `${count} vacatures matchen`);

// Legt uit waarom een zoekopdracht niets oplevert: de matches zitten in het
// archief of buiten de geselecteerde filters.
export function SearchHint({query, archivedCount, outsideFiltersCount, onIncludeArchived, onClearFilters}: Props) {
  if (archivedCount === 0 && outsideFiltersCount === 0) {
    return <p className={styles.hint} role="status">Niets gevonden voor &ldquo;{query}&rdquo;.</p>;
  }

  return (
    <div className={styles.hint} role="status">
      {archivedCount > 0 && (
        <p>
          {vacancies(archivedCount)} &ldquo;{query}&rdquo; in het archief.{" "}
          <button type="button" className={styles.action} onClick={onIncludeArchived}>
            Inclusief gearchiveerd tonen
          </button>
        </p>
      )}
      {outsideFiltersCount > 0 && (
        <p>
          {vacancies(outsideFiltersCount)} &ldquo;{query}&rdquo; buiten de huidige filters.{" "}
          <button type="button" className={styles.action} onClick={onClearFilters}>
            Filters wissen
          </button>
        </p>
      )}
    </div>
  );
}
