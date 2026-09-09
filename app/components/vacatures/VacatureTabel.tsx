import {useState} from "react";
import type {Sollicitatie, Vacature} from "~/lib/schemas";
import {FUNCTIE_LABELS, SOLLICITATIE_STATUS_LABELS} from "~/lib/schemas";
import {BronBadge} from "../elements/BronBadge";
import {Badge} from "../elements/Badge/Badge"
import {ApplyForJob} from "./ApplyForJob/ApplyForJob";
import styles from "./VacatureTabel.module.css";
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
  const navigate = useNavigate();


  if (vacatures.length === 0) {
    return <div className={styles.leeg}>Geen vacatures gevonden.</div>;
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
              className={`${styles.rij} vacature-rij`}
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
                <span className={styles.titel}>
                  {v.titel}
                  {v.functie && (
                    <span className={`${styles.functieBadge} ${styles[`functie_${v.functie}`]}`}>
                      {FUNCTIE_LABELS[v.functie]}
                    </span>
                  )}
                </span>
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
                {!isGesolliciteerd && onSolliciteer && (
                  <ApplyForJob
                    vacature={v}
                    onSolliciteer={onSolliciteer}
                    onGesolliciteerd={(datum) =>
                      setLokaalGesolliciteerd((prev) => ({...prev, [v.id]: datum}))
                    }
                  />
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
