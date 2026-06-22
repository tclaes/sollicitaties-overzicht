import {createFileRoute, notFound} from "@tanstack/react-router";
import {archiveVacature, getVacature} from "~/lib/vacatures";
import {setStatus} from "~/lib/statusStore";
import {StatusBadge} from "~/components/vacatures/StatusBadge";
import {BronBadge} from "~/components/vacatures/BronBadge";
import {formatDate} from "~/lib/date";
import styles from "./$id.module.css";
import {StatusSchema} from "~/lib/schemas";

export const Route = createFileRoute("/vacatures/$id")({
    loader: async ({params}) => {
        const vacature = await getVacature(params.id);
        if (!vacature) throw notFound();

        if (vacature.status === StatusSchema.enum.nieuw) {
            debugger
            await setStatus(params.id, StatusSchema.enum.bekeken);
            return {vacature: {...vacature, status: StatusSchema.enum.bekeken}};
        }
        return {vacature};
    },
    component: VacatureDetailPage,
    notFoundComponent: () => (
        <div className={styles.notFound}>
            <h1>Vacature niet gevonden</h1>
            <a href="/vacatures">Terug naar overzicht</a>
        </div>
    ),
});

function VacatureDetailPage() {
    const {vacature} = Route.useLoaderData();

    return (
        <main className={styles.page}>
            <nav className={styles.breadcrumb}>
                <a href="/">Dashboard</a>
                <span aria-hidden>›</span>
                <a href="/vacatures">Vacatures</a>
                <span aria-hidden>›</span>
                <span>{vacature.bedrijf}</span>
            </nav>

            <article className={styles.artikel}>
                <header className={styles.header}>
                    <div className={styles.badges}>
                        <StatusBadge status={vacature.status}/>
                        <BronBadge bron={vacature.bron}/>
                    </div>
                    <h1 className={styles.titel}>{vacature.titel}</h1>
                    <p className={styles.bedrijf}>{vacature.bedrijf}</p>
                    <p className={styles.meta}>
                        <span>{vacature.locatie}</span>
                        <span aria-hidden>·</span>
                        <span className={styles.datum}>
              Gevonden op {formatDate(vacature.gevondenOp.slice(0, 10))}
            </span>
                    </p>
                </header>

                {vacature.tags.length > 0 && (
                    <ul className={styles.tags} aria-label="Tags">
                        {vacature.tags.map((tag) => (
                            <li key={tag} className={styles.tag}>
                                {tag}
                            </li>
                        ))}
                    </ul>
                )}

                <section className={styles.beschrijving}>
                    <h2 className={styles.sectieTitle}>Beschrijving</h2>
                    <p>{vacature.beschrijving}</p>
                </section>

                {vacature.url && (
                    <footer className={styles.footer}>
                        <a
                            href={vacature.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.cta}
                        >
                            Bekijk vacature →
                        </a>
                        <div className="archive">
                            <label htmlFor="archive">Archive </label>
                            <input type="checkbox" id="archive" onChange={(e) => archiveVacature(vacature.id, e)}/>
                        </div>
                    </footer>
                )}
            </article>
        </main>
    );
}
