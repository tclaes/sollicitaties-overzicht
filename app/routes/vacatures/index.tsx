import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAlleVacatures } from "~/lib/vacatures";
import { VacatureTabel } from "~/components/vacatures/VacatureTabel";
import { StatsTeller } from "~/components/vacatures/StatsTeller";
import { FilterPills } from "~/components/vacatures/FilterPills";
import { StatusSchema, SourceSchema } from "~/lib/schemas";
import styles from "./index.module.css";

const sortingSchema = z.enum(["match", "datum", "titel"]);

const searchSchema = z.object({
  status: StatusSchema.optional(),
  source: SourceSchema.optional(),
  sort: sortingSchema.default("match"),
});

export const Route = createFileRoute("/vacatures/")({
  validateSearch: searchSchema,
  loader: async () => {
    const vacatures = await getAlleVacatures();
    return { vacatures };
  },
  component: VacaturesPage,
});

function VacaturesPage() {
  const { vacatures } = Route.useLoaderData();
  const search = Route.useSearch();

  const matchVolgorde: Record<string, number> = { sterk: 0, goed: 1, matig: 2, laag: 3 };

  const filtered = vacatures
    .filter((v) => {
      if (search.status && v.status !== search.status) return false;
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
      const ma = matchVolgorde[a.match?.score ?? "laag"] ?? 3;
      const mb = matchVolgorde[b.match?.score ?? "laag"] ?? 3;
      return ma - mb;
    });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>Alle vacatures</h1>
        <span className={styles.teller}>{filtered.length} vacatures</span>
      </header>

      <StatsTeller vacatures={vacatures} />
      <FilterPills currentSearch={search} />
      <VacatureTabel vacatures={filtered} />
    </div>
  );
}
