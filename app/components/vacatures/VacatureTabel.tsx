import { useState } from "react";
import type { Vacature } from "~/lib/schemas";
import { StatusBadge } from "./StatusBadge";
import { BronBadge } from "./BronBadge";
import { setStatus, setSollicitatieDatum } from "~/lib/statusStore";
import styles from "./VacatureTabel.module.css";

interface Props {
  vacatures: Vacature[];
}

function vandaag() {
  return new Date().toISOString().slice(0, 10);
}

export function VacatureTabel({ vacatures }: Props) {
  const [lokaleUpdates, setLokaleUpdates] = useState<Record<string, { datum?: string }>>({});
  const [openActie, setOpenActie] = useState<string | null>(null);
  const [datumInput, setDatumInput] = useState("");

  if (vacatures.length === 0) {
    return <div className={styles.leeg}>Geen vacatures gevonden.</div>;
  }

  function openSolliciteer(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setOpenActie(id);
    setDatumInput(vandaag());
  }

  function bevestig(e: React.FormEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setStatus(id, "gesolliciteerd");
    if (datumInput) setSollicitatieDatum(id, datumInput);
    setLokaleUpdates((prev) => ({ ...prev, [id]: { datum: datumInput || undefined } }));
    setOpenActie(null);
  }

  function annuleer(e: React.MouseEvent) {
    e.stopPropagation();
    setOpenActie(null);
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.tabel}>
        <thead>
          <tr>
            <th className={styles.colStatus}>Status</th>
            <th className={styles.colBron}>Bron</th>
            <th>Functie</th>
            <th className={styles.colTags}>Tags</th>
            <th className={styles.colLocatie}>Locatie</th>
            <th className={styles.colMatch}>Match</th>
            <th className={styles.colSolliciteer}></th>
          </tr>
        </thead>
        <tbody>
          {vacatures.map((v) => {
            const lokaal = lokaleUpdates[v.id];
            const isGesolliciteerd = v.status === "gesolliciteerd" || !!lokaal;
            const sollicitatieDatum = lokaal?.datum;

            return (
              <tr
                key={v.id}
                className={styles.rij}
                onClick={() => { window.location.href = `/vacatures/${v.id}`; }}
              >
                <td>
                  <StatusBadge status={isGesolliciteerd ? "gesolliciteerd" : v.status} />
                  {isGesolliciteerd && sollicitatieDatum && (
                    <span className={styles.sollicitatiedatum}>{sollicitatieDatum}</span>
                  )}
                </td>
                <td>
                  <BronBadge bron={v.bron} />
                </td>
                <td className={styles.functieCol}>
                  <span className={styles.titel}>{v.titel}</span>
                  <span className={styles.bedrijf}>{v.bedrijf}</span>
                </td>
                <td>
                  <ul className={styles.tags} aria-label="Tags">
                    {v.tags.slice(0, 3).map((tag) => (
                      <li key={tag} className={styles.tag}>{tag}</li>
                    ))}
                  </ul>
                </td>
                <td className={styles.locatie}>{v.locatie.split(",")[0]}</td>
                <td>
                  {v.match ? (
                    <span
                      className={`${styles.matchBadge} ${styles[`match_${v.match.score}`]}`}
                      title={v.match.toelichting}
                    >
                      {v.match.score}
                    </span>
                  ) : null}
                </td>
                <td className={styles.colSolliciteer} onClick={(e) => e.stopPropagation()}>
                  {!isGesolliciteerd && openActie !== v.id && (
                    <button
                      className={styles.solliciteerBtn}
                      onClick={(e) => openSolliciteer(e, v.id)}
                    >
                      Solliciteer
                    </button>
                  )}
                  {openActie === v.id && (
                    <form
                      className={styles.solliciteerForm}
                      onSubmit={(e) => bevestig(e, v.id)}
                    >
                      <input
                        type="date"
                        className={styles.datumInput}
                        value={datumInput}
                        onChange={(e) => setDatumInput(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className={styles.bevestigBtn} title="Bevestigen">✓</button>
                      <button type="button" className={styles.annuleerBtn} title="Annuleren" onClick={annuleer}>✕</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
