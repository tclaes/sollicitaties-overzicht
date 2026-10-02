import {useEffect, useState} from "react";
import styles from "./SearchBar.module.css";

export const SEARCH_DEBOUNCE_MS = 400;

export interface SearchParams {
  q?: string;
  archived?: boolean;
}

interface Props {
  currentSearch: SearchParams;
  onSearch: (params: SearchParams) => void;
}

// Zoekt automatisch zodra de gebruiker stopt met typen, of meteen bij Enter.
// De route bewaart de actieve filters, zodat zoeken binnen die filtering blijft.
export function SearchBar({currentSearch, onSearch}: Props) {
  const [query, setQuery] = useState(currentSearch.q ?? "");
  const appliedQuery = currentSearch.q ?? "";

  useEffect(() => {
    if (query.trim() === appliedQuery) return;
    const timeout = setTimeout(() => onSearch({q: query.trim() || undefined}), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query, appliedQuery, onSearch]);

  return (
    <form
      className={styles.bar}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch({q: query.trim() || undefined});
      }}
    >
      <input
        className={styles.input}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek op functie, tag of bedrijf…"
        aria-label="Zoek vacatures"
      />
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={currentSearch.archived ?? false}
          onChange={(e) => onSearch({archived: e.target.checked || undefined})}
        />
        Inclusief gearchiveerd
      </label>
    </form>
  );
}
