import { createFileRoute } from "@tanstack/react-router";
import { getSollicitaties } from "~/lib/vacatures";
import { SollicitatiesPanel } from "~/components/sollicitaties/SollicitatiesPanel";
import styles from "./index.module.css";

export const Route = createFileRoute("/sollicitaties/")({
  loader: async () => {
    const sollicitaties = await getSollicitaties();
    return { sollicitaties };
  },
  component: SollicitatiePagina,
});

function SollicitatiePagina() {
  const { sollicitaties } = Route.useLoaderData();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.titel}>Sollicitaties</h1>
        <p className={styles.teller}>{sollicitaties.length} totaal</p>
      </header>
      <SollicitatiesPanel sollicitaties={sollicitaties} />
    </div>
  );
}
