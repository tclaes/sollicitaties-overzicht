import {
  Application,
  ApplicationSchema,
  ApplicationStatus,
  MatchScore,
  Region,
  Source,
  Status,
  Vacancy,
  VacancySchema,
} from "./schemas";

/**
 * Firestore stores vacancies/applications with Dutch field names and enum
 * values (written by scripts/sync-vacancies-to-firestore.mjs). The app's zod
 * schemas are English, so every read/write crosses through the maps below.
 */

const STATUS_FROM_FIRESTORE: Record<string, Status> = {
  nieuw: "new",
  bekeken: "viewed",
  gesolliciteerd: "applied",
  afgewezen: "rejected",
  "niet-interessant": "not-interesting",
  "niet-aangeworven": "not-hired",
};
const STATUS_TO_FIRESTORE: Record<Status, string> = {
  new: "nieuw",
  viewed: "bekeken",
  applied: "gesolliciteerd",
  rejected: "afgewezen",
  "not-interesting": "niet-interessant",
  "not-hired": "niet-aangeworven",
};

const SOURCE_FROM_FIRESTORE: Record<string, Source> = {
  indeed: "indeed",
  vdab: "vdab",
  jobat: "jobat",
  linkedin: "linkedin",
  andere: "other",
};

const REGION_FROM_FIRESTORE: Record<string, Region> = {
  limburg: "limburg",
  antwerpen: "antwerp",
  brussel: "brussels",
  vlaanderen: "flanders",
  remote: "remote",
  andere: "other",
};
const REGION_TO_FIRESTORE: Record<Region, string> = {
  limburg: "limburg",
  antwerp: "antwerpen",
  brussels: "brussel",
  flanders: "vlaanderen",
  remote: "remote",
  other: "andere",
};

const MATCH_SCORE_FROM_FIRESTORE: Record<string, MatchScore> = {
  sterk: "strong",
  goed: "good",
  matig: "moderate",
  laag: "low",
  borderline: "borderline",
};

const APPLICATION_STATUS_FROM_FIRESTORE: Record<string, ApplicationStatus> = {
  gesolliciteerd: "applied",
  in_gesprek: "interviewing",
  afgewezen: "rejected",
  niet_wervend: "not_hiring",
  geen_reactie: "no_response",
  aangenomen: "hired",
};
const APPLICATION_STATUS_TO_FIRESTORE: Record<ApplicationStatus, string> = {
  applied: "gesolliciteerd",
  interviewing: "in_gesprek",
  rejected: "afgewezen",
  not_hiring: "niet_wervend",
  no_response: "geen_reactie",
  hired: "aangenomen",
};

export function statusToFirestore(status: Status): string {
  return STATUS_TO_FIRESTORE[status];
}

export function regionToFirestore(region: Region): string {
  return REGION_TO_FIRESTORE[region];
}

export function applicationStatusToFirestore(status: ApplicationStatus): string {
  return APPLICATION_STATUS_TO_FIRESTORE[status];
}

/** Maps a raw Firestore `vacatures` document into the app's `Vacancy` shape. */
export function vacancyFromFirestore(raw: Record<string, unknown>): Vacancy {
  const match = raw.match as { score?: string; toelichting?: string } | undefined;

  return VacancySchema.parse({
    id: raw.id,
    title: raw.titel,
    company: raw.bedrijf,
    location: raw.locatie,
    region: REGION_FROM_FIRESTORE[raw.regio as string] ?? raw.regio,
    url: raw.url,
    description: raw.beschrijving,
    source: SOURCE_FROM_FIRESTORE[raw.bron as string] ?? raw.bron,
    function: raw.functie,
    dateFound: raw.gevondenOp,
    status: STATUS_FROM_FIRESTORE[raw.status as string] ?? raw.status,
    isArchived: raw.isArchived,
    archiveReason: raw.archiefReden,
    dateArchived: raw.gearchiveerdOp,
    favorite: raw.favoriet,
    tags: raw.tags,
    match: match
      ? {
        score: MATCH_SCORE_FROM_FIRESTORE[match.score as string] ?? match.score,
        explanation: match.toelichting,
      }
      : undefined,
  });
}

/** Maps a raw Firestore `sollicitaties` document into the app's `Application` shape. */
export function applicationFromFirestore(raw: Record<string, unknown>): Application {
  return ApplicationSchema.parse({
    id: raw.id,
    vacancyId: raw.vacatureId,
    company: raw.bedrijf,
    role: raw.rol,
    appliedOn: raw.gesolliceerdOp,
    status: APPLICATION_STATUS_FROM_FIRESTORE[raw.status as string] ?? raw.status,
    note: raw.notitie,
  });
}
