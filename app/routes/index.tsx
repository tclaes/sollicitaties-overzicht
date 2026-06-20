import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getVacaturesVandaag } from "~/server/vacatures";
import { VacatureTabel } from "~/components/vacatures/VacatureTabel";
import { StatsTeller } from "~/components/vacatures/StatsTeller";
import { FilterPills } from "~/components/vacatures/FilterPills";
import { formatDatum } from "~/lib/date";
import { StatusSchema, BronSchema } from "~/lib/schemas";
import styles from "./index.module.css";

const searchSchema = z.object({
  status: StatusSchema.optional(),
  bron: BronSchema.optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  loader: async () => {
    const vandaag = await getVacaturesVandaag();
    return { vandaag };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { vandaag } = Route.useLoaderData();
  const search = Route.useSearch();
  const vandaagDatum = new Date().toISOString().slice(0, 10);

  const gefilterd = vandaag
    ? vandaag.vacatures.filter((v) => {
        if (search.status && v.status !== search.status) return false;
        if (search.bron && v.bron !== search.bron) return false;
        return true;
      })
    : [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>Vandaag</h1>
        <p className={styles.datum}>{formatDatum(vandaagDatum)}</p>
      </header>

      {vandaag ? (
        <>
          <StatsTeller vacatures={vandaag.vacatures} />
          <FilterPills huidigSearch={search} basePad="/" />
          <VacatureTabel vacatures={gefilterd} />
        </>
      ) : (
        <div className={styles.leeg}>
          <p>Nog geen vacatures voor vandaag.</p>
          <p className={styles.leegSub}>De dagelijkse taak loopt elke werkdag om 18:30.</p>
        </div>
      )}
    </div>
  );
}
