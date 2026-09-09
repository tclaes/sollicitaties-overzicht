import {createFileRoute} from "@tanstack/react-router";
import {getAllVacancies} from "~/lib/vacancies";
import {VacancyTable} from "~/components/vacancies/VacancyTable";
import {StatsCounter} from "~/components/elements/StatsCounter";
import {FilterPills} from "~/components/elements/FilterPills";
import {DefaultSearchSchema} from "~/lib/schemas";
import styles from "./index.module.css";


export const Route = createFileRoute("/vacatures/")({
  validateSearch: DefaultSearchSchema,
  loader: async () => {
    const vacancies = await getAllVacancies();
    return {vacancies};
  },
  component: VacanciesPage,
});

function VacanciesPage() {
  const {vacancies} = Route.useLoaderData();
  const search = Route.useSearch();

  const matchOrder: Record<string, number> = {sterk: 0, goed: 1, matig: 2, laag: 3};

  const showArchive = search.status === "niet-interessant";

  const filtered = vacancies?.filter((v) => {
    if (v.isArchived && !showArchive) return false;
    if (search.status && v.status !== search.status) return false;
    if (search.functie && v.functie !== search.functie) return false;
    return !(search.source && v.bron !== search.source);

  })
    .sort((a, b) => {
      if (search.sort === "datum") {
        return new Date(b.gevondenOp).getTime() - new Date(a.gevondenOp).getTime();
      }
      if (search.sort === "titel") {
        return a.titel.localeCompare(b.titel, "nl");
      }
      // match (default)
      const ma = matchOrder[a.match?.score ?? "laag"] ?? 3;
      const mb = matchOrder[b.match?.score ?? "laag"] ?? 3;
      return ma - mb;
    });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Alle vacatures</h1>
        <span className={styles.counter}>{filtered?.length} vacatures</span>
      </header>

      <StatsCounter vacancies={vacancies}/>
      <FilterPills currentSearch={search}/>
      <VacancyTable vacancies={filtered}/>
    </div>
  );
}
