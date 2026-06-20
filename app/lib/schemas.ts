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
export type Vacature = z.infer<typeof VacatureSchema>;
export type DagOverzicht = z.infer<typeof DagOverzichtSchema>;
