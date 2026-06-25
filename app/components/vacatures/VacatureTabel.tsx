import {useState} from "react";
import type {Sollicitatie, Vacature} from "~/lib/schemas";
import {SOLLICITATIE_STATUS_LABELS} from "~/lib/schemas";
import {BronBadge} from "../elements/BronBadge";
import {Badge} from "../elements/Badge/Badge"
import styles from "./VacatureTabel.module.css";
import {todayIso} from "~/lib/date";
import {useNavigate} from '@tanstack/react-router'


interface Props {
  vacatures: Vacature[];
  sollicitatiePerId?: Map<string, Sollicitatie>;
  onSolliciteer?: (data: {
    vacatureId: string;
    bedrijf: string;
    rol: string;
    gesolliceerdOp: string
  }) => Promise<void>;
}

export function VacatureTabel({vacatures, sollicitatiePerId = new Map(), onSolliciteer}: Props) {
  const [lokaalGesolliciteerd, setLokaalGesolliciteerd] = useState<Record<string, string>>({});
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [datumInput, setDatumInput] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  if (vacatures.length === 0) {
    return <div className={styles.leeg}>Geen vacatures gevonden.</div>;
  }

  function openSolliciteer(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setOpenAction(id);
    setDatumInput(todayIso());
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
        gesolliceerdOp: datumInput || todayIso(),
      });
      setLokaalGesolliciteerd((prev) => ({...prev, [v.id]: datumInput || todayIso()}));
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
              onClick={async () => {
                await navigate({to: `/vacatures/${v.id}`})
              }}
            >
              <td>
                <Badge status={isGesolliciteerd ? "gesolliciteerd" : v.status}/>
                {isGesolliciteerd && sollicitatieLabel && (
                  <span className={styles.sollicitatielabel}>{sollicitatieLabel}</span>
                )}
                {isGesolliciteerd && datum && (
                  <span className={styles.sollicitatiedatum}>{datum}</span>
                )}
              </td>
              <td>
                <BronBadge bron={v.bron}/>
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
                    type="button"
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
                      aria-label="autofocus"
                    />
                    <button type="submit" className={styles.bevestigBtn} title="Bevestigen"
                            disabled={loading}>✓
                    </button>
                    <button type="button" className={styles.annuleerBtn} title="Annuleren"
                            onClick={cancel}>✕
                    </button>
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
