import {useCallback} from "react";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import {createApplication, getAllVacancies, getApplications} from "~/lib/vacancies";
import {VacancyTable} from "~/components/vacancies/VacancyTable";
import {StatsCounter} from "~/components/elements/StatsCounter";
import {FilterPills} from "~/components/elements/FilterPills";
import {Pagination} from "~/components/elements/Pagination";
import {SearchBar, SearchParams} from "~/components/elements/SearchBar/SearchBar";
import {filterVacancies} from "~/lib/vacancyFilter";
import {Application, DefaultSearchSchema, PAGE_SIZE} from "~/lib/schemas";
import styles from "./index.module.css";


export const Route = createFileRoute("/vacatures/")({
  validateSearch: DefaultSearchSchema,
  loader: async () => {
    const [vacancies, applications] = await Promise.all([
      getAllVacancies(),
      getApplications(),
    ]);
    return {vacancies, applications};
  },
  component: VacanciesPage,
});

function VacanciesPage() {
  const {vacancies, applications} = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = Route.useNavigate();

  const handleSearch = useCallback(
    (params: SearchParams) => navigate({search: (prev) => ({...prev, ...params, page: 1})}),
    [navigate],
  );

  const applicationById = new Map<string, Application>(
    applications.flatMap((s) => s.vacancyId ? [[s.vacancyId, s]] : [])
  );

  const matchOrder: Record<string, number> = {strong: 0, good: 1, moderate: 2, low: 3};

  const filtered = filterVacancies(vacancies ?? [], search)
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

  const totalItems = filtered?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(search.page ?? 1, totalPages);
  const pageItems = filtered?.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalItems);

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
          {totalItems > 0 ? `${pageStart}–${pageEnd} van ${totalItems} vacatures` : "0 vacatures"}
        </span>
      </header>

      {vacancies.length > 0 ? (
        <>
          <StatsCounter vacancies={vacancies}/>
          <SearchBar currentSearch={search} onSearch={handleSearch}/>
          <FilterPills currentSearch={search}/>
          <VacancyTable
            vacancies={pageItems ?? []}
            applicationById={applicationById}
            onApply={handleApply}
          />
          <Pagination
            totalItems={totalItems}
            currentPage={currentPage}
            basePath="/vacatures"
            currentSearch={search}
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
