import {useState} from "react";
import type {ApplicationStatus as ApplicationStatusValue} from "~/lib/schemas";
import {APPLICATION_STATUS_LABELS} from "~/lib/schemas";
import {archiveVacancy, updateApplication} from "~/lib/vacancies";
import styles from "./ApplicationStatus.module.css";

const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatusValue[];

const STATUS_CSS_CLASS: Record<ApplicationStatusValue, string> = {
  applied: "status_gesolliciteerd",
  interviewing: "status_in_gesprek",
  not_hired: "status_niet_aangeworven",
  no_response: "status_geen_reactie",
  hired: "status_aangenomen",
};

interface Props {
  applicationId: string;
  vacancyId?: string;
  status: ApplicationStatusValue;
  onChanged?: (status: ApplicationStatusValue) => void;
}

/**
 * Inline, bewerkbare status van een sollicitatie - de effectieve status
 * (in gesprek/niet aangeworven/aangenomen/...), niet enkel "gesolliciteerd".
 * Gebruikt op het vacature-overzicht zodat de status niet enkel via de
 * Sollicitaties-tab aan te passen is (zie ApplicationsPanel voor dezelfde
 * mutatie op die andere plek).
 */
export function ApplicationStatus({applicationId, vacancyId, status, onChanged}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ApplicationStatusValue;
    if (next === status || busy) return;
    setBusy(true);
    try {
      await updateApplication(applicationId, next);
      if (next === "not_hired" && vacancyId) {
        await archiveVacancy(vacancyId, true);
      }
      onChanged?.(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      className={`${styles.statusSelect} ${styles[STATUS_CSS_CLASS[status]]}`}
      value={status}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      disabled={busy}
      aria-label="Status van de sollicitatie"
    >
      {STATUSES.map((st) => (
        <option key={st} value={st}>{APPLICATION_STATUS_LABELS[st]}</option>
      ))}
    </select>
  );
}
