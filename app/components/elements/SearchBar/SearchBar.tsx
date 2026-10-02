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
  // Optimistisch: de route houdt de oude search vast tot de loader klaar is
  // (bv. het archief ophalen), de checkbox moet intussen meteen omklappen.
  const appliedArchived = currentSearch.archived ?? false;
  const [archived, setArchived] = useState(appliedArchived);

  useEffect(() => setArchived(appliedArchived), [appliedArchived]);

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
          checked={archived}
          onChange={(e) => {
            setArchived(e.target.checked);
            onSearch({archived: e.target.checked || undefined});
          }}
        />
        Inclusief gearchiveerd
      </label>
    </form>
  );
}
