import { useState } from "react";
import type { Vacature, Sollicitatie } from "~/lib/schemas";
import { StatusBadge } from "./StatusBadge";
import { BronBadge } from "./BronBadge";
import styles from "./VacatureTabel.module.css";

const SOLLICITATIE_STATUS_LABELS: Record<Sollicitatie["status"], string> = {
  gesolliciteerd: "gesolliciteerd",
  in_gesprek: "in gesprek",
  afgewezen: "afgewezen",
  niet_wervend: "niet wervend",
  geen_reactie: "geen reactie",
  aangenomen: "aangenomen",
};

interface Props {
  vacatures: Vacature[];
  sollicitatiePerId?: Map<string, Sollicitatie>;
  onSolliciteer?: (data: { vacatureId: string; bedrijf: string; rol: string; gesolliceerdOp: string }) => Promise<void>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function VacatureTabel({ vacatures, sollicitatiePerId = new Map(), onSolliciteer }: Props) {
  const [lokaalGesolliciteerd, setLokaalGesolliciteerd] = useState<Record<string, string>>({});
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [datumInput, setDatumInput] = useState("");
  const [loading, setLoading] = useState(false);


  if (vacatures.length === 0) {
    return <div className={styles.leeg}>Geen vacatures gevonden.</div>;
  }

  function openSolliciteer(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setOpenAction(id);
    setDatumInput(today());
  }

  async function confirm(e: React.FormEvent, v: Vacature) {
    e.preventDefault();
    e.stopPropagation();
    if (!onSolliciteer) return;
    setLoading(true);
    try {
      await onSolliciteer({
        vacatureId: v.id,
        bedrijf: v.bedrijf,
        rol: v.titel,
        gesolliceerdOp: datumInput || today(),
      });
      setLokaalGesolliciteerd((prev) => ({ ...prev, [v.id]: datumInput || today() }));
    } finally {
      setLoading(false);
      setOpenAction(null);
    }
  }

  function cancel(e: React.MouseEvent) {
    e.stopPropagation();
    setOpenAction(null);
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
            const sollicitatie = sollicitatiePerId.get(v.id);
            const lokaalDatum = lokaalGesolliciteerd[v.id];
            const isGesolliciteerd = !!sollicitatie || !!lokaalDatum;
            const sollicitatieLabel = sollicitatie
              ? SOLLICITATIE_STATUS_LABELS[sollicitatie.status]
              : lokaalDatum
              ? "wacht"
              : null;
            const datum = sollicitatie?.gesolliceerdOp ?? lokaalDatum;

            return (
              <tr
                key={v.id}
                className={styles.rij}
                onClick={() => { window.location.href = `/vacatures/${v.id}`; }}
              >
                <td>
                  <StatusBadge status={isGesolliciteerd ? "gesolliciteerd" : v.status} />
                  {isGesolliciteerd && sollicitatieLabel && (
                    <span className={styles.sollicitatielabel}>{sollicitatieLabel}</span>
                  )}
                  {isGesolliciteerd && datum && (
                    <span className={styles.sollicitatiedatum}>{datum}</span>
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
                  {!isGesolliciteerd && onSolliciteer && openAction !== v.id && (
                    <button
                      className={styles.solliciteerBtn}
                      onClick={(e) => openSolliciteer(e, v.id)}
                    >
                      Solliciteer
                    </button>
                  )}
                  {openAction === v.id && (
                    <form
                      className={styles.solliciteerForm}
                      onSubmit={(e) => confirm(e, v)}
                    >
                      <input
                        type="date"
                        className={styles.datumInput}
                        value={datumInput}
                        onChange={(e) => setDatumInput(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className={styles.bevestigBtn} title="Bevestigen" disabled={loading}>✓</button>
                      <button type="button" className={styles.annuleerBtn} title="Annuleren" onClick={cancel}>✕</button>
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
