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
    return { overzicht, sollicitaties };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { overzicht, sollicitaties } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();

  async function handleSolliciteer(data: { vacatureId: string; bedrijf: string; rol: string; gesolliceerdOp: string }) {
    await createSollicitatie(data);
    await router.invalidate();
  }

  const sollicitatiePerId = new Map<string, Sollicitatie>(
    sollicitaties.flatMap((s) => s.vacatureId ? [[s.vacatureId, s]] : [])
  );

  const matchVolgorde: Record<string, number> = { sterk: 0, goed: 1, matig: 2, laag: 3 };

  const gefilterd = overzicht
    ? overzicht.vacatures.filter((v) => {
        if (search.status && v.status !== search.status) return false;
        if (search.bron && v.bron !== search.bron) return false;
        return true;
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>Vacatures</h1>
        {overzicht && <p className={styles.datum}>Bijgewerkt op {formatDatum(overzicht.datum)}</p>}
      </header>

      {overzicht ? (
        <>
          <StatsTeller vacatures={overzicht.vacatures} />
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
          <p className={styles.leegSub}>De dagelijkse taak loopt elke werkdag om 18:30.</p>
        </div>
      )}
    </div>
  );
}
