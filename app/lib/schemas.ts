import {z} from "zod";

export const SortingSchema = z.enum(["match", "datum", "titel"]);

export const SourceSchema = z.enum([
  "indeed",
  "vdab",
  "jobat",
  "linkedin",
  "andere",
]);

export const StatusSchema = z.enum([
  "nieuw",
  "bekeken",
  "gesolliciteerd",
  "afgewezen",
  "niet-interessant",
]);

export const RoleSchema = z.enum(["frontend", "fullstack"]);

export const ROLE_LABELS: Record<Role, string> = {
  frontend: "frontend",
  fullstack: "full stack",
};

export const DefaultSearchSchema = z.object({
  status: StatusSchema.optional(),
  source: SourceSchema.optional(),
  functie: RoleSchema.optional(),
  sort: SortingSchema.default("match"),
});

export const RegionSchema = z.enum([
  "limburg",
  "antwerpen",
  "brussel",
  "vlaanderen",
  "remote",
  "andere",
]);

export const MatchScoreSchema = z.enum(["sterk", "goed", "matig", "laag", "borderline"]);

export const ApplicationStatusSchema = z.enum([
  "gesolliciteerd",
  "in_gesprek",
  "afgewezen",
  "niet_wervend",
  "geen_reactie",
  "aangenomen",
]);

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  gesolliciteerd: "gesolliciteerd",
  in_gesprek: "in gesprek",
  afgewezen: "afgewezen",
  niet_wervend: "niet wervend",
  geen_reactie: "geen reactie",
  aangenomen: "aangenomen",
};

export const ApplicationSchema = z.object({
  id: z.string(),
  vacatureId: z.string().optional(),
  bedrijf: z.string(),
  rol: z.string(),
  gesolliceerdOp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: ApplicationStatusSchema,
  notitie: z.string().optional(),
});

export const VacancySchema = z.object({
  id: z.string(),
  titel: z.string(),
  bedrijf: z.string(),
  locatie: z.string(),
  regio: RegionSchema,
  url: z.union([z.string().url(), z.literal(""), z.string().startsWith("/")]),
  beschrijving: z.string(),
  bron: SourceSchema,
  functie: RoleSchema.optional(),
  gevondenOp: z.string().datetime(),
  status: StatusSchema.default("nieuw"),
  isArchived: z.boolean().optional(),
  archiefReden: z.string().optional(),
  gearchiveerdOp: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  match: z.object({
    score: MatchScoreSchema,
    toelichting: z.string(),
  }).optional(),
});

export const DailyOverviewSchema = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vacatures: z.array(VacancySchema),
  metadata: z.object({
    bronBestand: z.string(),
    aantalGevonden: z.number(),
    verwerktOp: z.string().datetime(),
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
