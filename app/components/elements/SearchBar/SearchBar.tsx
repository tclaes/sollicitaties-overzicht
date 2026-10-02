import styles from "./SearchBar.module.css";

interface Props {
  currentSearch: {
    status?: string;
    source?: string;
    function?: string;
    sort?: string;
    q?: string;
    archived?: boolean;
  };
  basePath?: string;
}

// Gewoon GET-formulier: de actieve filters gaan mee als hidden inputs, zodat
// zoeken altijd binnen de geselecteerde filtering blijft. Pagina valt weg.
export function SearchBar({currentSearch, basePath = "/vacatures"}: Props) {
  const {status, source, function: role, sort} = currentSearch;
  const keptFilters = {status, source, function: role, sort};

  return (
    <form className={styles.bar} role="search" action={basePath} method="get">
      {Object.entries(keptFilters).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value}/> : null
      )}
      <input
        className={styles.input}
        type="search"
        name="q"
        defaultValue={currentSearch.q ?? ""}
        placeholder="Zoek op functie of tag…"
        aria-label="Zoek vacatures"
      />
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          name="archived"
          value="true"
          defaultChecked={currentSearch.archived ?? false}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
        Inclusief gearchiveerd
      </label>
      <button className={styles.button} type="submit">Zoeken</button>
    </form>
  );
}
