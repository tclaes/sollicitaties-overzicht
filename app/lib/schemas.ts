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

export const FunctieSchema = z.enum(["frontend", "fullstack"]);

export const FUNCTIE_LABELS: Record<Functie, string> = {
  frontend: "frontend",
  fullstack: "full stack",
};

export const DefaultSearchSchema = z.object({
  status: StatusSchema.optional(),
  source: SourceSchema.optional(),
  functie: FunctieSchema.optional(),
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

export const SollicitatieStatusSchema = z.enum([
  "gesolliciteerd",
  "in_gesprek",
  "afgewezen",
  "niet_wervend",
  "geen_reactie",
  "aangenomen",
]);

export const SOLLICITATIE_STATUS_LABELS: Record<SollicitatieStatus, string> = {
  gesolliciteerd: "gesolliciteerd",
  in_gesprek: "in gesprek",
  afgewezen: "afgewezen",
  niet_wervend: "niet wervend",
  geen_reactie: "geen reactie",
  aangenomen: "aangenomen",
};

export const SollicitatieSchema = z.object({
  id: z.string(),
  vacatureId: z.string().optional(),
  bedrijf: z.string(),
  rol: z.string(),
  gesolliceerdOp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: SollicitatieStatusSchema,
  notitie: z.string().optional(),
});

export const VacatureSchema = z.object({
  id: z.string(),
  titel: z.string(),
  bedrijf: z.string(),
  locatie: z.string(),
  regio: RegionSchema,
  url: z.union([z.string().url(), z.literal(""), z.string().startsWith("/")]),
  beschrijving: z.string(),
  bron: SourceSchema,
  functie: FunctieSchema.optional(),
  gevondenOp: z.string().datetime(),
  status: StatusSchema.default("nieuw"),
  isArchived: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
  match: z.object({
    score: MatchScoreSchema,
    toelichting: z.string(),
  }).optional(),
});

export const DagOverzichtSchema = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vacatures: z.array(VacatureSchema),
  metadata: z.object({
    bronBestand: z.string(),
    aantalGevonden: z.number(),
    verwerktOp: z.string().datetime(),
  }),
});

export type Bron = z.infer<typeof SourceSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type Functie = z.infer<typeof FunctieSchema>;
export type MatchScore = z.infer<typeof MatchScoreSchema>;
export type SollicitatieStatus = z.infer<typeof SollicitatieStatusSchema>;
export type Sollicitatie = z.infer<typeof SollicitatieSchema>;
export type Vacature = z.infer<typeof VacatureSchema>;
