import styles from "./InfiniteScrollFooter.module.css";

interface Props {
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
  supportsObserver: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  onLoadMore: () => void;
}

// Onderaan de lijst: de sentinel die het bijladen triggert, en de eindmelding.
// Zonder IntersectionObserver valt het terug op een "Meer laden"-knop.
export function InfiniteScrollFooter({hasMore, loadedCount, totalCount, supportsObserver, sentinelRef, onLoadMore}: Props) {
  if (totalCount === 0) return null;

  return (
    <div className={styles.footer}>
      <p className={styles.status} role="status">
        {hasMore ? `${loadedCount} van ${totalCount} vacatures geladen` : "Alle vacatures geladen"}
      </p>
      {hasMore && (
        supportsObserver
          ? <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true"/>
          : <button type="button" className={styles.button} onClick={onLoadMore}>Meer laden</button>
      )}
    </div>
  );
}
