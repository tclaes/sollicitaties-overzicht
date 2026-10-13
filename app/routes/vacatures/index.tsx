import {useCallback} from "react";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import {
  createApplication,
  getActiveVacancies,
  getApplications,
  getArchivedVacancies,
  getVacancyCounts,
} from "~/lib/vacancies";
import {VacancyTable} from "~/components/vacancies/VacancyTable";
import {StatsCounter} from "~/components/elements/StatsCounter";
import {FilterPills} from "~/components/elements/FilterPills";
import {InfiniteScrollFooter} from "~/components/elements/InfiniteScrollFooter/InfiniteScrollFooter";
import {SearchBar, SearchParams} from "~/components/elements/SearchBar/SearchBar";
import {SearchHint} from "~/components/elements/SearchHint/SearchHint";
import {countOutsideFilters, filterVacancies, needsArchive} from "~/lib/vacancyFilter";
import {useInfiniteList} from "~/lib/useInfiniteList";
import {Application, DefaultSearchSchema} from "~/lib/schemas";
import styles from "./index.module.css";


export const Route = createFileRoute("/vacatures/")({
  validateSearch: DefaultSearchSchema,
  // Gearchiveerde vacatures worden pas opgehaald als de gebruiker er om vraagt.
  loaderDeps: ({search}) => ({withArchive: needsArchive(search)}),
  // Bewust geen staleTime: terug-navigeren toont de gecachte data meteen en haalt
  // ze op de achtergrond opnieuw op. Wijzigingen op de detailpagina (status
  // "bekeken", favoriet, sollicitatiestatus) roepen niet overal invalidate() aan.
  loader: async ({deps}) => {
    const [active, archived, applications, counts] = await Promise.all([
      getActiveVacancies(),
      deps.withArchive ? getArchivedVacancies() : Promise.resolve([]),
      getApplications(),
      getVacancyCounts(),
    ]);
    // Een gearchiveerd document met een actieve status zit in beide lijsten.
    const seen = new Set(active.map((v) => v.id));
    const vacancies = [...active, ...archived.filter((v) => !seen.has(v.id))];
    return {vacancies, applications, counts, archiveLoaded: deps.withArchive};
  },
  component: VacanciesPage,
});

function VacanciesPage() {
  const {vacancies, applications, counts, archiveLoaded} = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = Route.useNavigate();

  const handleSearch = useCallback(
    (params: SearchParams) => navigate({search: (prev) => ({...prev, ...params})}),
    [navigate],
  );

  const applicationById = new Map<string, Application>(
    applications.flatMap((s) => s.vacancyId ? [[s.vacancyId, s]] : [])
  );

  const matchOrder: Record<string, number> = {strong: 0, good: 1, moderate: 2, low: 3};

  const filtered = filterVacancies(vacancies, search)
    .sort((a, b) => {
      const favoriteDiff = Number(b.favorite ?? false) - Number(a.favorite ?? false);
      if (favoriteDiff !== 0) return favoriteDiff;

      if (search.sort === "date") {
        return new Date(b.dateFound).getTime() - new Date(a.dateFound).getTime();
      }
      if (search.sort === "title") {
        return a.title.localeCompare(b.title, "nl");
      }
      // match (default)
      const ma = matchOrder[a.match?.score ?? "low"] ?? 3;
      const mb = matchOrder[b.match?.score ?? "low"] ?? 3;
      return ma - mb;
    });

  const totalItems = filtered.length;
  const outsideFilters = search.q && totalItems === 0 ? countOutsideFilters(vacancies, search) : null;
  const {items: visibleItems, hasMore, loadMore, sentinelRef, supportsObserver} = useInfiniteList(
    filtered,
    JSON.stringify(search),
  );

  async function handleApply(data: {
    vacancyId: string;
    company: string;
    role: string;
    appliedOn: string
  }) {
    await createApplication(data);
    await router.invalidate();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Vacatures</h1>
        <span className={styles.counter}>
          {totalItems === 1 ? "1 vacature" : `${totalItems} vacatures`}
        </span>
      </header>

      {counts.total > 0 || vacancies.length > 0 ? (
        <>
          <StatsCounter counts={counts} currentSearch={search}/>
          <SearchBar currentSearch={search} onSearch={handleSearch}/>
          <FilterPills currentSearch={search}/>
          {search.q && outsideFilters !== null && (
            <SearchHint
              query={search.q}
              canIncludeArchived={!archiveLoaded}
              outsideFiltersCount={outsideFilters}
              onIncludeArchived={() => handleSearch({archived: true})}
              onClearFilters={() => navigate({
                search: (prev) => ({...prev, status: undefined, source: undefined, function: undefined}),
              })}
            />
          )}
          <VacancyTable
            vacancies={visibleItems}
            applicationById={applicationById}
            onApply={handleApply}
          />
          <InfiniteScrollFooter
            hasMore={hasMore}
            loadedCount={visibleItems.length}
            totalCount={totalItems}
            supportsObserver={supportsObserver}
            sentinelRef={sentinelRef}
            onLoadMore={loadMore}
          />
        </>
      ) : (
        <div className={styles.empty}>
          <p>Nog geen vacatures gevonden.</p>
          <p className={styles.emptySub}>De dagelijkse taak loopt elke werkdag om 12:00.</p>
        </div>
      )}
    </div>
  );
}
