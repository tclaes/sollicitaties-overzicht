import {useCallback, useEffect, useState} from "react";
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
  // Laatste zoekterm die we zelf naar de URL stuurden; zo kunnen we een wijziging
  // door Back/Forward onderscheiden van onze eigen navigatie.
  const [submittedQuery, setSubmittedQuery] = useState(appliedQuery);
  const [prevAppliedQuery, setPrevAppliedQuery] = useState(appliedQuery);

  // Alleen een URL-wijziging die niet van onszelf komt (Back/Forward) overschrijft de input.
  const urlChanged = appliedQuery !== prevAppliedQuery;
  const urlChangedOutsideInput = urlChanged && appliedQuery !== submittedQuery;

  if (urlChanged) setPrevAppliedQuery(appliedQuery);
  if (urlChangedOutsideInput) syncQuery(appliedQuery);

  function syncQuery(q: string) {
    setSubmittedQuery(q);
    setQuery(q);
  }

  const applyQuery = useCallback((q: string) => {
    setSubmittedQuery(q);
    onSearch({q: q || undefined});
  }, [onSearch]);

  // Optimistisch: de route houdt de oude search vast tot de loader klaar is
  // (bv. het archief ophalen), de checkbox moet intussen meteen omklappen.
  const appliedArchived = currentSearch.archived ?? false;
  const [archived, setArchived] = useState(appliedArchived);

  const [prevAppliedArchived, setPrevAppliedArchived] = useState(appliedArchived);
  if (appliedArchived !== prevAppliedArchived) {
    setPrevAppliedArchived(appliedArchived);
    setArchived(appliedArchived);
  }

  useEffect(() => {
    if (query.trim() === appliedQuery) return;
    const timeout = setTimeout(() => applyQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query, appliedQuery, applyQuery]);

  return (
    <form
      className={styles.bar}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        applyQuery(query.trim());
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
