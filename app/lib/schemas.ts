import {z} from "zod";

export const SortingSchema = z.enum(["match", "date", "title"]);

export const SourceSchema = z.enum([
  "indeed",
  "vdab",
  "jobat",
  "linkedin",
  "other",
]);

export const StatusSchema = z.enum([
  "new",
  "viewed",
  "applied",
  "rejected",
  "not-interesting",
  "not-hired",
]);

export const RoleSchema = z.enum(["frontend", "fullstack"]);

export const ROLE_LABELS: Record<Role, string> = {
  frontend: "frontend",
  fullstack: "full stack",
};

export const SOURCE_LABELS: Record<Source, string> = {
  indeed: "indeed",
  vdab: "vdab",
  jobat: "jobat",
  linkedin: "linkedin",
  other: "andere",
};

// Aantal vacatures dat per keer bijgeladen wordt bij het scrollen.
export const PAGE_SIZE = 25;

export const DefaultSearchSchema = z.object({
  status: StatusSchema.optional(),
  source: SourceSchema.optional(),
  function: RoleSchema.optional(),
  sort: SortingSchema.default("match"),
  // TanStack Router parset "?q=123" als number en "?archived=true" als boolean.
  q: z.coerce.string().trim().transform((v) => v || undefined).optional().catch(undefined),
  archived: z.preprocess((v) => v === true || v === "true", z.boolean()).optional().catch(undefined),
});

export const RegionSchema = z.enum([
  "limburg",
  "antwerp",
  "brussels",
  "flanders",
  "remote",
  "other",
]);

export const MatchScoreSchema = z.enum(["strong", "good", "moderate", "low", "borderline"]);

export const MATCH_SCORE_LABELS: Record<MatchScore, string> = {
  strong: "sterk",
  good: "goed",
  moderate: "matig",
  low: "laag",
  borderline: "borderline",
};

// "rejected" (afgewezen) en "not_hiring" (niet wervend) waren voor de gebruiker
// niet te onderscheiden statussen die hetzelfde betekenden ("geen aanbod
// gekregen"). Samengevoegd tot "not_hired" op 22-09-2026 - zie
// firestoreMappers.ts voor de migratie van bestaande sollicitatie-documenten.
export const ApplicationStatusSchema = z.enum([
  "applied",
  "interviewing",
  "not_hired",
  "no_response",
  "hired",
]);

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "gesolliciteerd",
  interviewing: "in gesprek",
  not_hired: "niet aangeworven",
  no_response: "geen reactie",
  hired: "aangenomen",
};

export const ApplicationSchema = z.object({
  id: z.string(),
  vacancyId: z.string().optional(),
  company: z.string(),
  role: z.string(),
  appliedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: ApplicationStatusSchema,
  note: z.string().optional(),
});

export const VacancySchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  region: RegionSchema,
  url: z.union([z.string().url(), z.literal(""), z.string().startsWith("/")]),
  description: z.string(),
  source: SourceSchema,
  function: RoleSchema.optional(),
  dateFound: z.string().datetime(),
  status: StatusSchema.default("new"),
  isArchived: z.boolean().optional(),
  archiveReason: z.string().optional(),
  dateArchived: z.string().datetime().optional(),
  favorite: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
  match: z.object({
    score: MatchScoreSchema,
    explanation: z.string(),
  }).optional(),
});

export const DailyOverviewSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vacancies: z.array(VacancySchema),
  metadata: z.object({
    sourceFile: z.string(),
    foundCount: z.number(),
    processedAt: z.string().datetime(),
  }),
});

export type Source = z.infer<typeof SourceSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type MatchScore = z.infer<typeof MatchScoreSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
export type Vacancy = z.infer<typeof VacancySchema>;
