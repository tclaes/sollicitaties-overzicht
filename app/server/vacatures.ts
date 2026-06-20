import { createServerFn } from "@tanstack/react-start";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import { DagOverzichtSchema, VacatureSchema, StatusSchema } from "~/lib/schemas";
import type { Vacature, DagOverzicht } from "~/lib/schemas";

const DATA_DIR = join(process.cwd(), "data", "vacatures");

function leesOverzicht(datum: string): DagOverzicht | null {
  const pad = join(DATA_DIR, `${datum}.json`);
  if (!existsSync(pad)) return null;
  const raw = JSON.parse(readFileSync(pad, "utf-8"));
  return DagOverzichtSchema.parse(raw);
}

export const getVacaturesVandaag = createServerFn({ method: "GET" }).handler(
  async () => {
    const datum = new Date().toISOString().slice(0, 10);
    return leesOverzicht(datum);
  }
);

export const getVacaturesVoorDatum = createServerFn({ method: "GET" })
  .validator(z.object({ datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
  .handler(async ({ data }) => {
    return leesOverzicht(data.datum);
  });

export const getAlleDatums = createServerFn({ method: "GET" }).handler(
  async () => {
    if (!existsSync(DATA_DIR)) return [];
    return readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();
  }
);

export const getAlleVacatures = createServerFn({ method: "GET" }).handler(
  async (): Promise<Vacature[]> => {
    if (!existsSync(DATA_DIR)) return [];
    const bestanden = readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    return bestanden.flatMap((bestand) => {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, bestand), "utf-8"));
      const overzicht = DagOverzichtSchema.safeParse(raw);
      return overzicht.success ? overzicht.data.vacatures : [];
    });
  }
);

export const getVacature = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Vacature | null> => {
    if (!existsSync(DATA_DIR)) return null;
    const bestanden = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    for (const bestand of bestanden) {
      const raw = JSON.parse(readFileSync(join(DATA_DIR, bestand), "utf-8"));
      const overzicht = DagOverzichtSchema.safeParse(raw);
      if (!overzicht.success) continue;
      const gevonden = overzicht.data.vacatures.find((v) => v.id === data.id);
      if (gevonden) return gevonden;
    }
    return null;
  });

export const updateVacatureStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status: StatusSchema,
    })
  )
  .handler(async ({ data }) => {
    const pad = join(DATA_DIR, `${data.datum}.json`);
    if (!existsSync(pad)) throw new Error(`Geen data voor ${data.datum}`);
    const raw = JSON.parse(readFileSync(pad, "utf-8"));
    const overzicht = DagOverzichtSchema.parse(raw);
    const vacature = overzicht.vacatures.find((v) => v.id === data.id);
    if (!vacature) throw new Error(`Vacature ${data.id} niet gevonden`);
    vacature.status = data.status;
    const { writeFileSync } = await import("fs");
    writeFileSync(pad, JSON.stringify(overzicht, null, 2), "utf-8");
    return { ok: true };
  });
