import {useCallback, useEffect, useState} from "react";
import {PAGE_SIZE} from "./schemas";

const ROOT_MARGIN = "400px";
const STORAGE_PREFIX = "infinite-list:";

interface State {
  key: string;
  count: number;
  // Of er sinds de laatste scroll-trigger al een chunk vooruit geladen is.
  prefetched: boolean;
}

function readStoredCount(key: string): number | null {
  try {
    const stored = Number(sessionStorage.getItem(STORAGE_PREFIX + key));
    return Number.isInteger(stored) && stored > 0 ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredCount(key: string, count: number) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, String(count));
  } catch {
    // sessionStorage kan geblokkeerd zijn; de lijst werkt dan gewoon zonder herstel.
  }
}

function initialState(key: string): State {
  const stored = readStoredCount(key);
  return {key, count: stored ?? PAGE_SIZE, prefetched: stored !== null};
}

function requestIdle(callback: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const handle = requestIdleCallback(callback);
    return () => cancelIdleCallback(handle);
  }
  const handle = setTimeout(callback, 200);
  return () => clearTimeout(handle);
}

/**
 * Toont een lijst in chunks van PAGE_SIZE. De volledige lijst zit al in het
 * geheugen (de loader haalt ze één keer op); dit beperkt enkel wat gerenderd wordt.
 * - scrollen naar de sentinel laadt de volgende chunk;
 * - als de browser idle is, wordt één chunk vooruit geladen;
 * - het aantal geladen items wordt per `resetKey` onthouden voor terug-navigatie
 *   en reset zodra de key (filters/sortering) wijzigt.
 */
export function useInfiniteList<T>(items: T[], resetKey: string) {
  const [state, setState] = useState<State>(() => initialState(resetKey));
  const [sentinel, setSentinel] = useState<Element | null>(null);

  const current = state.key === resetKey ? state : initialState(resetKey);
  const visibleCount = Math.min(current.count, items.length);
  const hasMore = visibleCount < items.length;
  const supportsObserver = typeof IntersectionObserver !== "undefined";

  const loadMore = useCallback(() => {
    setState((prev) => {
      const base = prev.key === resetKey ? prev : initialState(resetKey);
      return {key: resetKey, count: base.count + PAGE_SIZE, prefetched: false};
    });
  }, [resetKey]);

  useEffect(() => {
    if (!sentinel || !hasMore || !supportsObserver) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      {rootMargin: ROOT_MARGIN},
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // `visibleCount`: opnieuw observeren zodat een sentinel die na het laden
    // nog in beeld is meteen opnieuw triggert.
  }, [sentinel, hasMore, supportsObserver, loadMore, visibleCount]);

  useEffect(() => {
    if (!hasMore || current.prefetched) return;
    return requestIdle(() => {
      setState((prev) => {
        const base = prev.key === resetKey ? prev : initialState(resetKey);
        return base.prefetched ? prev : {key: resetKey, count: base.count + PAGE_SIZE, prefetched: true};
      });
    });
  }, [hasMore, current.prefetched, current.count, resetKey]);

  useEffect(() => {
    writeStoredCount(resetKey, current.count);
  }, [resetKey, current.count]);

  return {
    items: items.slice(0, visibleCount),
    hasMore,
    loadMore,
    sentinelRef: setSentinel,
    supportsObserver,
  };
}
