import {createFileRoute, notFound} from "@tanstack/react-router";
import {getVacancy} from "~/lib/vacancies";
import {setStatus} from "~/lib/statusStore";
import {Badge} from "~/components/elements/Badge/Badge";
import {SourceBadge} from "~/components/elements/SourceBadge";
import {formatDate} from "~/lib/date";
import styles from "./$id.module.css";
import {ROLE_LABELS, StatusSchema} from "~/lib/schemas";
import {CLink} from "~/components/elements/Link/CLink";
import {NotFoundComponent} from "~/elements/NotFound/NotFoundComponent";
import {NotInteresting} from "~/components/vacancies/NotInteresting/NotInteresting";

export const Route = createFileRoute("/vacatures/$id")({
  loader: async ({params}) => {
    const vacancy = await getVacancy(params.id);
    if (!vacancy) throw notFound();

    if (vacancy.status === StatusSchema.enum.nieuw) {
      await setStatus(params.id, StatusSchema.enum.bekeken);
      return {vacancy: {...vacancy, status: StatusSchema.enum.bekeken}};
    }
    return {vacancy};
  },
  component: VacancyDetailPage,
  notFoundComponent: NotFoundComponent
});

function VacancyDetailPage() {
  const {vacancy} = Route.useLoaderData();

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb}>
        <a href="/">Dashboard</a>
        <span aria-hidden>›</span>
        <a href="/vacatures">Vacatures</a>
        <span aria-hidden>›</span>
        <span>{vacancy.bedrijf}</span>
      </nav>

      <article className={styles.article}>
        <header className={styles.header}>
          <div className={styles.badges}>
            <Badge status={vacancy.status}/>
            <SourceBadge source={vacancy.bron}/>
            {vacancy.functie && (
              <span className={styles.roleBadge}>{ROLE_LABELS[vacancy.functie]}</span>
            )}
          </div>
          <h1 className={styles.title}>{vacancy.titel}</h1>
          <p className={styles.company}>{vacancy.bedrijf}</p>
          <p className={styles.meta}>
            <span>{vacancy.locatie}</span>
            <span aria-hidden>·</span>
            <span className={styles.date}>
              Gevonden op {formatDate(vacancy.gevondenOp.slice(0, 10))}
            </span>
          </p>
        </header>

        {vacancy.tags.length > 0 && (
          <ul className={styles.tags} aria-label="Tags">
            {vacancy.tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}

        <section className={styles.description}>
          <h2 className={styles.sectionTitle}>Beschrijving</h2>
          <p>{vacancy.beschrijving}</p>
        </section>

        <NotInteresting
          id={vacancy.id}
          isArchived={vacancy.isArchived ?? false}
          reason={vacancy.archiefReden}
        />

        {(vacancy.url && !vacancy.isArchived) && (
          <footer className={styles.footer}>
            <CLink url={vacancy.url} variant={"cta"} target={"_blank"}>Bekijk vacature →</CLink>
          </footer>
        )}
      </article>
    </main>
  );
}
