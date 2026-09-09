import {useState} from "react";
import {createFileRoute, notFound, useRouter} from "@tanstack/react-router";
import {getVacature, herstelVacature, markeerNietInteressant} from "~/lib/vacatures";
import {setStatus} from "~/lib/statusStore";
import {Badge} from "~/components/elements/Badge/Badge";
import {BronBadge} from "~/components/elements/BronBadge";
import {formatDate} from "~/lib/date";
import styles from "./$id.module.css";
import {FUNCTIE_LABELS, StatusSchema} from "~/lib/schemas";
import {CLink} from "~/components/elements/Link/CLink";

export const Route = createFileRoute("/vacatures/$id")({
  loader: async ({params}) => {
    const vacature = await getVacature(params.id);
    if (!vacature) throw notFound();

    if (vacature.status === StatusSchema.enum.nieuw) {
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
            <Badge status={vacature.status}/>
            <BronBadge bron={vacature.bron}/>
            {vacature.functie && (
              <span className={styles.functieBadge}>{FUNCTIE_LABELS[vacature.functie]}</span>
            )}
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

        <NietInteressant
          id={vacature.id}
          isArchived={vacature.isArchived ?? false}
          reden={vacature.archiefReden}
        />

        {vacature.url && (
          <footer className={styles.footer}>
            <CLink url={vacature.url} variant={"cta"}>Bekijk vacature →</CLink>
          </footer>
        )}
      </article>
    </main>
  );
}

function NietInteressant({id, isArchived, reden}: { id: string; isArchived: boolean; reden?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tekst, setTekst] = useState("");
  const [bezig, setBezig] = useState(false);

  async function bevestig(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    try {
      await markeerNietInteressant(id, tekst.trim() || "Niet interessant voor mij");
      setOpen(false);
      setTekst("");
      await router.invalidate();
    } finally {
      setBezig(false);
    }
  }

  async function herstel() {
    setBezig(true);
    try {
      await herstelVacature(id);
      await router.invalidate();
    } finally {
      setBezig(false);
    }
  }

  if (isArchived) {
    return (
      <section className={styles.archief}>
        <h2 className={styles.sectieTitle}>Gearchiveerd — niet interessant</h2>
        <p className={styles.archiefReden}>{reden || "Niet interessant voor mij"}</p>
        <button type="button" className={styles.herstelBtn} onClick={herstel} disabled={bezig}>
          Terugzetten
        </button>
      </section>
    );
  }

  return (
    <section className={styles.archief}>
      {!open ? (
        <button type="button" className={styles.nietInteressantBtn} onClick={() => setOpen(true)}>
          Niet interessant
        </button>
      ) : (
        <form className={styles.archiefForm} onSubmit={bevestig}>
          <label htmlFor="archiefReden" className={styles.sectieTitle}>
            Waarom is deze vacature niet interessant?
          </label>
          <textarea
            id="archiefReden"
            className={styles.archiefTextarea}
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Bijv. te backend-gericht, buiten de regio, freelance…"
          />
          <div className={styles.archiefActies}>
            <button type="submit" className={styles.nietInteressantBtn} disabled={bezig}>
              Archiveren
            </button>
            <button type="button" className={styles.herstelBtn} onClick={() => setOpen(false)} disabled={bezig}>
              Annuleren
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
