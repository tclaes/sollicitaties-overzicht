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

  const matchOrder: Record<string, number> = {strong: 0, good: 1, moderate: 2, low: 3};

  const showArchive = search.status === "not-interesting";

  const filtered = vacancies?.filter((v) => {
    if (showArchive) {
      if (!v.isArchived) return false;
    } else {
      if (v.isArchived) return false;
      if (search.status && v.status !== search.status) return false;
    }
    if (search.function && v.function !== search.function) return false;
    return !(search.source && v.source !== search.source);

  })
    .sort((a, b) => {
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
