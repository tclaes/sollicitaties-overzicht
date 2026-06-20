import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAlleVacatures, getVacaturesVoorDatum } from "~/server/vacatures";
import { VacatureList } from "~/components/vacatures/VacatureList";
import { VacatureFilter } from "~/components/vacatures/VacatureFilter";
import { formatDatum } from "~/lib/date";
import { StatusSchema, RegioSchema, BronSchema } from "~/lib/schemas";
import styles from "./index.module.css";

const searchSchema = z.object({
  datum: z.string().optional(),
  status: StatusSchema.optional(),
  regio: RegioSchema.optional(),
  bron: BronSchema.optional(),
});

export const Route = createFileRoute("/vacatures/")({
  validateSearch: searchSchema,
  loader: async ({ location }) => {
    const search = searchSchema.parse(
      Object.fromEntries(new URLSearchParams(location.search))
    );
    if (search.datum) {
      const overzicht = await getVacaturesVoorDatum({ data: { datum: search.datum } });
      return { vacatures: overzicht?.vacatures ?? [], datum: search.datum };
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
    if (search.regio && v.regio !== search.regio) return false;
    if (search.bron && v.bron !== search.bron) return false;
    return true;
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>
          {datum ? formatDatum(datum) : "Alle vacatures"}
        </h1>
        <p className={styles.teller}>{gefilterd.length} vacatures</p>
      </header>

      <VacatureFilter huidigSearch={search} />
      <VacatureList vacatures={gefilterd} datum={datum ?? undefined} />
    </main>
  );
}
