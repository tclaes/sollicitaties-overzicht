import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAlleVacatures, getVacaturesVoorDatum } from "~/lib/vacatures";
import { VacatureTabel } from "~/components/vacatures/VacatureTabel";
import { StatsTeller } from "~/components/vacatures/StatsTeller";
import { FilterPills } from "~/components/vacatures/FilterPills";
import { formatDatum } from "~/lib/date";
import { StatusSchema, BronSchema } from "~/lib/schemas";
import styles from "./index.module.css";

const searchSchema = z.object({
  datum: z.string().optional(),
  status: StatusSchema.optional(),
  bron: BronSchema.optional(),
});

export const Route = createFileRoute("/vacatures/")({
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const params = Object.fromEntries(new URLSearchParams(location.search));
    const datum = searchSchema.parse(params).datum;
    if (datum) {
      const overzicht = await getVacaturesVoorDatum(datum);
      return { vacatures: overzicht?.vacatures ?? [], datum };
    }
    const vacatures = await getAlleVacatures();
    return { vacatures, datum: null };
  },
  component: VacaturesPage,
});

function VacaturesPage() {
  const { vacatures, datum } = Route.useLoaderData();
  const search = Route.useSearch();

  const gefilterd = vacatures.filter((v) => {
    if (search.status && v.status !== search.status) return false;
    if (search.bron && v.bron !== search.bron) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>
          {datum ? formatDatum(datum) : "Alle vacatures"}
        </h1>
        <span className={styles.teller}>{gefilterd.length} vacatures</span>
      </header>

      <StatsTeller vacatures={vacatures} />
      <FilterPills huidigSearch={search} />
      <VacatureTabel vacatures={gefilterd} />
    </div>
  );
}
