import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { getVacaturesOverzicht, getSollicitaties, createSollicitatie } from "~/lib/vacatures";
import { VacatureTabel } from "~/components/vacatures/VacatureTabel";
import { StatsTeller } from "~/components/vacatures/StatsTeller";
import { FilterPills } from "~/components/vacatures/FilterPills";
import { formatDatum } from "~/lib/date";
import { StatusSchema, BronSchema } from "~/lib/schemas";
import type { Sollicitatie } from "~/lib/schemas";
import styles from "./index.module.css";

const SorteerSchema = z.enum(["match", "datum", "titel"]);

const searchSchema = z.object({
  status: StatusSchema.optional(),
  bron: BronSchema.optional(),
  sorteer: SorteerSchema.default("match"),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  loader: async () => {
    const [overzicht, sollicitaties] = await Promise.all([
      getVacaturesOverzicht(),
      getSollicitaties(),
    ]);
    return { overview: overzicht, sollicitaties };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { overview, sollicitaties } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();

  const sollicitatiePerId = new Map<string, Sollicitatie>(
    sollicitaties.flatMap((s) => s.vacatureId ? [[s.vacatureId, s]] : [])
  );

  const matchVolgorde: Record<string, number> = { sterk: 0, goed: 1, matig: 2, laag: 3 };

  const gefilterd = overview
    ? overview.vacatures.filter((v) => {
        if (v.status === "gesolliciteerd" || sollicitatiePerId.has(v.id)) return false;
        if (search.status && v.status !== search.status) return false;
        return !(search.bron && v.bron !== search.bron);

      })
    : [];

  const gesorteerd = [...gefilterd].sort((a, b) => {
    if (search.sorteer === "datum") {
      return new Date(b.gevondenOp).getTime() - new Date(a.gevondenOp).getTime();
    }
    if (search.sorteer === "titel") {
      return a.titel.localeCompare(b.titel, "nl");
    }
    return (matchVolgorde[a.match?.score ?? "laag"] ?? 3) - (matchVolgorde[b.match?.score ?? "laag"] ?? 3);
  });

  async function handleSolliciteer(data: { vacatureId: string; bedrijf: string; rol: string; gesolliceerdOp: string }) {
    await createSollicitatie(data);
    await router.invalidate();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>Vacatures</h1>
        {overview && <p className={styles.datum}>Bijgewerkt op {formatDatum(overview.datum)}</p>}
      </header>

      {overview ? (
        <>
          <StatsTeller vacatures={overview.vacatures} />
          <FilterPills huidigSearch={search} basePad="/" />
          <VacatureTabel
            vacatures={gesorteerd}
            sollicitatiePerId={sollicitatiePerId}
            onSolliciteer={handleSolliciteer}
          />
        </>
      ) : (
        <div className={styles.leeg}>
          <p>Nog geen vacatures gevonden.</p>
          <p className={styles.leegSub}>De dagelijkse taak loopt elke werkdag om 12:00.</p>
        </div>
      )}
    </div>
  );
}
