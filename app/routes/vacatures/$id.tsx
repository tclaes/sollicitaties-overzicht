import {useState} from "react";
import {createFileRoute, notFound, useRouter} from "@tanstack/react-router";
import {createApplication, getApplications, getVacancy} from "~/lib/vacancies";
import {setStatus} from "~/lib/statusStore";
import {Badge} from "~/components/elements/Badge/Badge";
import {SourceBadge} from "~/components/elements/SourceBadge";
import {formatDate} from "~/lib/date";
import styles from "./$id.module.css";
import {ROLE_LABELS, StatusSchema} from "~/lib/schemas";
import type {ApplicationStatus as ApplicationStatusValue} from "~/lib/schemas";
import {CLink} from "~/components/elements/Link/CLink";
import {NotFoundComponent} from "~/elements/NotFound/NotFoundComponent";
import {NotInteresting} from "~/components/vacancies/NotInteresting/NotInteresting";
import {FavoriteButton} from "~/components/elements/FavoriteButton/FavoriteButton";
import {ApplyForJob} from "~/components/vacancies/ApplyForJob/ApplyForJob";
import {ApplicationStatus} from "~/components/vacancies/ApplicationStatus/ApplicationStatus";

export const Route = createFileRoute("/vacatures/$id")({
  loader: async ({params}) => {
    const [vacancy, applications] = await Promise.all([
      getVacancy(params.id),
      getApplications(),
    ]);
    if (!vacancy) throw notFound();
    const application = applications.find((a) => a.vacancyId === params.id) ?? null;

    if (vacancy.status === StatusSchema.enum.new) {
      await setStatus(params.id, StatusSchema.enum.viewed);
      return {vacancy: {...vacancy, status: StatusSchema.enum.viewed}, application};
    }
    return {vacancy, application};
  },
  component: VacancyDetailPage,
  notFoundComponent: NotFoundComponent
});

function VacancyDetailPage() {
  const {vacancy, application} = Route.useLoaderData();
  const router = useRouter();
  const [favorite, setFavorite] = useState(vacancy.favorite ?? false);
  const [statusOverride, setStatusOverride] = useState<ApplicationStatusValue | null>(null);
  const applicationStatus = application ? statusOverride ?? application.status : null;

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb}>
        <a href="/vacatures">Vacatures</a>
        <span aria-hidden>›</span>
        <span>{vacancy.company}</span>
      </nav>

      <article className={styles.article}>
        <header className={styles.header}>
          <div className={styles.badges}>
            <Badge status={application ? "applied" : vacancy.status}/>
            <SourceBadge source={vacancy.source}/>
            {vacancy.function && (
              <span className={styles.roleBadge}>{ROLE_LABELS[vacancy.function]}</span>
            )}
            <FavoriteButton id={vacancy.id} favorite={favorite} onToggled={setFavorite}/>
          </div>
          <h1 className={styles.title}>{vacancy.title}</h1>
          <p className={styles.company}>{vacancy.company}</p>
          <p className={styles.meta}>
            <span>{vacancy.location}</span>
            <span aria-hidden>·</span>
            <span className={styles.date}>
              Gevonden op {formatDate(vacancy.dateFound.slice(0, 10))}
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
          <p>{vacancy.description}</p>
        </section>

        {(application || !vacancy.isArchived) && (
          <section className={styles.application} aria-label="Sollicitatie">
            {application && applicationStatus ? (
              <>
                <ApplicationStatus
                  applicationId={application.id}
                  vacancyId={vacancy.id}
                  status={applicationStatus}
                  onChanged={(next) => {
                    setStatusOverride(next);
                    if (next === "not_hired") void router.invalidate();
                  }}
                />
                <span className={styles.applicationDate}>
                  Gesolliciteerd op {formatDate(application.appliedOn)}
                </span>
              </>
            ) : (
              <ApplyForJob
                vacancy={vacancy}
                onApply={async (data) => {
                  await createApplication(data);
                  await router.invalidate();
                }}
                onApplied={() => undefined}
                alwaysVisible
              />

            )}

            <NotInteresting
              id={vacancy.id}
              isArchived={vacancy.isArchived ?? false}
              reason={vacancy.archiveReason}
              status={vacancy.status}
            />
          </section>
        )}



        {(vacancy.url && !vacancy.isArchived) && (
          <footer className={styles.footer}>
            <CLink url={vacancy.url} variant={"cta"} target={"_blank"}>Bekijk vacature →</CLink>
          </footer>
        )}
      </article>
    </main>
  );
}
