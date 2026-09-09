import {createFileRoute, useRouter} from "@tanstack/react-router";
import {createApplication, getApplications, getVacanciesDashboard} from "~/lib/vacancies";
import {VacancyTable} from "~/components/vacancies/VacancyTable";
import {StatsCounter} from "~/components/elements/StatsCounter";
import {FilterPills} from "~/components/elements/FilterPills";
import {DefaultSearchSchema, Application} from "~/lib/schemas";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  validateSearch: DefaultSearchSchema,
  loader: async () => {
    const [overview, applications] = await Promise.all([
      getVacanciesDashboard(),
      getApplications(),
    ]);
    return {overview, applications};
  },
  component: DashboardPage,
});

function DashboardPage() {
  const {overview, applications} = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();

  const applicationById = new Map<string, Application>(
    applications.flatMap((s) => s.vacatureId ? [[s.vacatureId, s]] : [])
  );

  const matchOrder: Record<string, number> = {sterk: 0, goed: 1, matig: 2, laag: 3, borderline: 4};

  const prefiltered = overview
    ? overview.filter((v) => {
      if (search.status && v.status !== search.status) return false;
      return !(search.source && v.bron !== search.source);

    })
    : [];

  const sorted = [...prefiltered].sort((a, b) => {
    if (search.sort === "datum") {
      return new Date(b.gevondenOp).getTime() - new Date(a.gevondenOp).getTime();
    }
    if (search.sort === "titel") {
      return a.titel.localeCompare(b.titel, "nl");
    }
    return (matchOrder[a.match?.score ?? "laag"] ?? 3) - (matchOrder[b.match?.score ?? "laag"] ?? 3);
  });

  async function handleApply(data: {
    vacatureId: string;
    bedrijf: string;
    rol: string;
    gesolliceerdOp: string
  }) {
    await createApplication(data);
    await router.invalidate();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Vacatures</h1>
      </header>

      {overview ? (
        <>
          <StatsCounter vacancies={overview}/>
          <FilterPills currentSearch={search} basePath="/"/>
          <VacancyTable
            vacancies={sorted}
            applicationById={applicationById}
            onApply={handleApply}
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
