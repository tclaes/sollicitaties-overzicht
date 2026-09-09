import { createFileRoute } from "@tanstack/react-router";
import { getApplications } from "~/lib/vacancies";
import { ApplicationsPanel } from "~/components/applications/ApplicationsPanel";
import styles from "./index.module.css";

export const Route = createFileRoute("/sollicitaties/")({
  loader: async () => {
    const applications = await getApplications();
    return { applications };
  },
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { applications } = Route.useLoaderData();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sollicitaties</h1>
        <p className={styles.counter}>{applications.length} totaal</p>
      </header>
      <ApplicationsPanel applications={applications} />
    </div>
  );
}
