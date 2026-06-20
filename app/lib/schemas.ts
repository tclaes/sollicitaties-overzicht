import { z } from "zod";

export const BronSchema = z.enum([
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

export const RegioSchema = z.enum([
  "limburg",
  "antwerpen",
  "brussel",
  "vlaanderen",
  "remote",
  "andere",
]);

export const MatchScoreSchema = z.enum(["sterk", "goed", "matig", "laag"]);

export const SollicitatieStatusSchema = z.enum([
  "gesolliciteerd",
  "in_gesprek",
  "afgewezen",
  "niet_wervend",
  "geen_reactie",
  "aangenomen",
]);

export const SollicitatieSchema = z.object({
  id: z.string(),
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
  regio: RegioSchema,
  url: z.union([z.string().url(), z.literal(""), z.string().startsWith("/")]),
  beschrijving: z.string(),
  bron: BronSchema,
  gevondenOp: z.string().datetime(),
  status: StatusSchema.default("nieuw"),
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

export type Bron = z.infer<typeof BronSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Regio = z.infer<typeof RegioSchema>;
export type MatchScore = z.infer<typeof MatchScoreSchema>;
export type SollicitatieStatus = z.infer<typeof SollicitatieStatusSchema>;
export type Sollicitatie = z.infer<typeof SollicitatieSchema>;
export type Vacature = z.infer<typeof VacatureSchema>;
export type DagOverzicht = z.infer<typeof DagOverzichtSchema>;
