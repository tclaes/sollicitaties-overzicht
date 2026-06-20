import { createFileRoute } from "@tanstack/react-router";
import { getVacaturesVandaag, getAlleDatums } from "~/server/vacatures";
import { VacatureList } from "~/components/vacatures/VacatureList";
import { StatsTeller } from "~/components/vacatures/StatsTeller";
import { formatDatum } from "~/lib/date";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [vandaag, datums] = await Promise.all([
      getVacaturesVandaag(),
      getAlleDatums(),
    ]);
    return { vandaag, datums };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { vandaag, datums } = Route.useLoaderData();
  const vandaagDatum = new Date().toISOString().slice(0, 10);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>Vandaag</h1>
        <p className={styles.datum}>{formatDatum(vandaagDatum)}</p>
      </header>

      {vandaag ? (
        <>
          <StatsTeller vacatures={vandaag.vacatures} />
          <VacatureList vacatures={vandaag.vacatures} datum={vandaag.datum} />
        </>
      ) : (
        <div className={styles.leeg}>
          <p>Nog geen vacatures voor vandaag.</p>
          <p className={styles.leegSub}>
            De dagelijkse taak loopt elke dag om 12:00.
          </p>
        </div>
      )}

      {datums.length > 0 && (
        <aside className={styles.historie}>
          <h2 className={styles.historieTitle}>Eerder</h2>
          <ul className={styles.datumLijst}>
            {datums.slice(0, 7).map((datum) => (
              <li key={datum}>
                <a href={`/vacatures?datum=${datum}`} className={styles.datumLink}>
                  {formatDatum(datum)}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </main>
  );
}
