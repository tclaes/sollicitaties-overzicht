import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { checkSyncInput, GECONTROLEERD_VERPLICHT_VANAF } from "./check-sync-input.mjs";

const TODAY = "2026-11-06";
// Vóór de invoerdatum: ontbrekende gecontroleerdOp is dan enkel een waarschuwing.
const opts = { today: TODAY, verplichtVanaf: "2026-11-20" };

function vacature(extra: Record<string, unknown> = {}) {
  return {
    titel: "Front-end Developer",
    bedrijf: "Acme",
    locatie: "Gent",
    regio: "vlaanderen",
    url: "https://acme.example/jobs/1",
    beschrijving: "x",
    bron: "andere",
    gecontroleerdOp: "2026-11-05",
    ...extra,
  };
}

const codes = (r: { errors: { code: string }[] }) => r.errors.map((e) => e.code);

describe("checkSyncInput: vorm", () => {
  it("accepteert een geldige input", () => {
    const r = checkSyncInput([vacature()], opts);
    expect(r.errors).toEqual([]);
    expect(r.summary).toEqual({ total: 1, actief: 1 });
  });

  it("eist titel, bedrijf en url voor actieve items, niet voor verlopen items", () => {
    const r = checkSyncInput([vacature({ bedrijf: "" }), { url: "https://x.be/a", verlopen: true }], opts);
    expect(codes(r)).toEqual(["vorm"]);
    expect(r.errors[0].message).toContain('"bedrijf"');
  });

  it("weigert input die geen array is", () => {
    expect(codes(checkSyncInput({}, opts))).toEqual(["vorm"]);
  });
});

describe("checkSyncInput: url en document-id", () => {
  it("meldt dezelfde url met andere queryparameters en trailing slash", () => {
    const r = checkSyncInput(
      [
        vacature({ url: "https://example.com/jobs/1?utm=a" }),
        vacature({ titel: "Andere titel", bedrijf: "Ander", url: "https://example.com/jobs/1/" }),
      ],
      opts
    );
    // Het document-id wordt van de genormaliseerde url afgeleid, dus dit is ook een id-botsing.
    expect(codes(r)).toEqual(["dubbel-id"]);
    expect(r.errors[0].message).toContain("#0");
    expect(r.errors[0].message).toContain("#1");
  });

  it("meldt dezelfde url ook als de items een verschillend expliciet id hebben", () => {
    const r = checkSyncInput(
      [
        vacature({ id: "een", titel: "A", bedrijf: "X", url: "https://example.com/jobs/1" }),
        vacature({ id: "twee", titel: "B", bedrijf: "Y", url: "https://example.com/jobs/1/?utm=a" }),
      ],
      opts
    );
    expect(codes(r)).toEqual(["dubbel-url"]);
  });

  it("houdt Indeed-vacatures met verschillende jk gescheiden", () => {
    const r = checkSyncInput(
      [
        vacature({ titel: "A", bedrijf: "X", url: "https://be.indeed.com/viewjob?jk=aaa" }),
        vacature({ titel: "B", bedrijf: "Y", url: "https://be.indeed.com/viewjob?jk=bbb" }),
      ],
      opts
    );
    expect(r.errors).toEqual([]);
  });

  it("meldt twee items met hetzelfde expliciete id", () => {
    const r = checkSyncInput(
      [
        vacature({ id: "gedeeld", url: "https://a.be/1", titel: "A", bedrijf: "X" }),
        vacature({ id: "gedeeld", url: "https://b.be/2", titel: "B", bedrijf: "Y" }),
      ],
      opts
    );
    expect(codes(r)).toContain("dubbel-id");
  });
});

describe("checkSyncInput: dezelfde vacature via meerdere bronnen", () => {
  const kingfisher = {
    titel: "Full Stack Developer (.NET / Angular)",
    bedrijf: "onbekend (via Kingfisher Recruitment)",
    locatie: "Berchem (Antwerpen)",
  };

  it("meldt dezelfde vacature op twee jobsites", () => {
    const r = checkSyncInput(
      [
        vacature({ ...kingfisher, url: "https://kingfisher-recruitment.be/vacatures/a" }),
        vacature({ ...kingfisher, url: "https://www.vdab.be/vindeenjob/vacatures/1/a" }),
      ],
      opts
    );
    expect(codes(r)).toEqual(["dubbel-vacature"]);
    expect(r.errors[0].message).toContain("kingfisher-recruitment.be");
    expect(r.errors[0].message).toContain("vdab.be");
    expect(r.errors[0].message).toContain("extraBronnen");
  });

  it("meldt een afwijkende schrijfwijze van full-stack als dezelfde vacature", () => {
    const r = checkSyncInput(
      [
        vacature({ titel: "Fullstack .NET developer", bedrijf: "LGA IT", locatie: "Kontich", url: "https://a.be/1" }),
        vacature({ titel: "Full-Stack .NET Developer (m/v/x)", bedrijf: "LGA IT", locatie: "Kontich", url: "https://b.be/2" }),
      ],
      opts
    );
    expect(codes(r)).toEqual(["dubbel-vacature"]);
  });

  it("meldt geen duplicaat bij een ander rolniveau bij hetzelfde bedrijf", () => {
    const r = checkSyncInput(
      [
        vacature({ titel: "Lead Front-End Developer", bedrijf: "CraftCode", locatie: "Edegem", url: "https://a.be/1" }),
        vacature({ titel: "Front-end Developer", bedrijf: "CraftCode", locatie: "Edegem", url: "https://a.be/2" }),
      ],
      opts
    );
    expect(r.errors).toEqual([]);
    expect(r.warnings.filter((w) => w.code !== "gecontroleerd-ontbreekt")).toEqual([]);
  });

  it("waarschuwt bij dezelfde titel en bedrijf met een andere locatie", () => {
    const r = checkSyncInput(
      [
        vacature({ titel: "Fullstack Web Developer", bedrijf: "Goed zorgwinkel", locatie: "Mechelen", url: "https://a.be/1" }),
        vacature({ titel: "Fullstack Web Developer", bedrijf: "Goed zorgwinkel", locatie: "Gent", url: "https://a.be/2" }),
      ],
      opts
    );
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w) => w.code)).toContain("zelfde-titel-andere-locatie");
  });

  it("laat twee items met elk een eigen expliciet id toe", () => {
    const r = checkSyncInput(
      [
        vacature({ id: "een", url: "https://a.be/1" }),
        vacature({ id: "twee", url: "https://a.be/2" }),
      ],
      opts
    );
    expect(r.errors).toEqual([]);
  });
});

describe("checkSyncInput: archief wint", () => {
  const archief = {
    titel: "Lead Front-End Developer Edegem",
    bedrijf: "CraftCode (via Cronos)",
    locatie: "Edegem",
    url: "https://www.codejobs.be/vacature/1",
    nietInteressant: true,
    archiefReden: "x",
  };

  it("meldt een actief item dat dezelfde vacature is als een niet-interessant item", () => {
    const r = checkSyncInput(
      [
        vacature(archief),
        vacature({ titel: "Lead Front-End Developer", bedrijf: "CraftCode (Cronos-groep)", locatie: "Edegem (Antwerpen)", url: "https://it-jobs.be/vacature/1" }),
      ],
      opts
    );
    expect(codes(r)).toEqual(["archief-terug"]);
    expect(r.errors[0].message).toContain("gearchiveerd");
  });

  it("meldt een gearchiveerde vacature die met een andere schrijfwijze van de titel terugkomt", () => {
    const r = checkSyncInput(
      [
        vacature({
          titel: "Full-stack developer (.NET / Angular)",
          bedrijf: "onbekend (via Editx)",
          locatie: "Antwerpen",
          url: "https://www.vdab.be/vindeenjob/vacatures/73914622/x",
          nietInteressant: true,
        }),
        vacature({
          titel: "Full Stack Developer (.NET / Angular)",
          bedrijf: "onbekend (via Kingfisher Recruitment)",
          locatie: "Antwerpen (Centrum)",
          url: "https://kingfisher-recruitment.be/vacatures/b",
        }),
      ],
      opts
    );
    expect(codes(r)).toEqual(["archief-terug"]);
  });

  it("meldt een actief item waarvan de url in extraBronnen van een archief-item staat", () => {
    const r = checkSyncInput(
      [
        vacature({
          titel: "Front-end Developer (CraftCode)",
          bedrijf: "Cronos",
          url: "https://codejobs.be/vacature/2",
          extraBronnen: [{ bron: "andere", url: "https://it-jobs.be/vacature/2" }],
          nietInteressant: true,
        }),
        vacature({ titel: "Front-end Developer", bedrijf: "CraftCode", url: "https://it-jobs.be/vacature/2/" }),
      ],
      opts
    );
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("laat een verlopen item met dezelfde sleutel ongemoeid", () => {
    const r = checkSyncInput([vacature({ verlopen: true }), vacature({ url: "https://acme.example/jobs/2" })], opts);
    expect(r.errors).toEqual([]);
  });
});

describe("checkSyncInput: gecontroleerdOp", () => {
  it("accepteert een item dat 3 dagen geleden is gecontroleerd", () => {
    expect(checkSyncInput([vacature({ gecontroleerdOp: "2026-11-03" })], opts).errors).toEqual([]);
  });

  it("meldt een item dat 20 dagen niet is gecontroleerd, met het aantal dagen", () => {
    const r = checkSyncInput([vacature({ gecontroleerdOp: "2026-10-17" })], opts);
    expect(codes(r)).toEqual(["gecontroleerd-verouderd"]);
    expect(r.errors[0].message).toContain("20 dagen");
  });

  it("accepteert precies 14 dagen en weigert 15", () => {
    expect(checkSyncInput([vacature({ gecontroleerdOp: "2026-10-23" })], opts).errors).toEqual([]);
    expect(codes(checkSyncInput([vacature({ gecontroleerdOp: "2026-10-22" })], opts))).toEqual(["gecontroleerd-verouderd"]);
  });

  it("weigert een datum in de toekomst en een ongeldig formaat", () => {
    expect(codes(checkSyncInput([vacature({ gecontroleerdOp: "2026-11-07" })], opts))).toEqual(["gecontroleerd-toekomst"]);
    expect(codes(checkSyncInput([vacature({ gecontroleerdOp: "06-11-2026" })], opts))).toEqual(["gecontroleerd-formaat"]);
    expect(codes(checkSyncInput([vacature({ gecontroleerdOp: "2026-13-45" })], opts))).toEqual(["gecontroleerd-formaat"]);
  });

  it("waarschuwt bij een ontbrekende datum tijdens de invoerperiode", () => {
    const { gecontroleerdOp: _weg, ...zonder } = vacature();
    const r = checkSyncInput([zonder], opts);
    expect(r.errors).toEqual([]);
    expect(r.warnings.map((w) => w.code)).toEqual(["gecontroleerd-ontbreekt"]);
  });

  it("maakt een ontbrekende datum een fout vanaf de invoerdatum", () => {
    const { gecontroleerdOp: _weg, ...zonder } = vacature();
    const r = checkSyncInput([zonder], { today: "2026-11-20", verplichtVanaf: "2026-11-20" });
    expect(codes(r)).toEqual(["gecontroleerd-ontbreekt"]);
  });

  it("slaat verlopen en niet-interessante items over", () => {
    const { gecontroleerdOp: _weg, ...zonder } = vacature();
    const r = checkSyncInput(
      [
        { ...zonder, verlopen: true },
        { ...zonder, url: "https://acme.example/jobs/2", titel: "Andere", nietInteressant: true },
      ],
      { today: "2030-01-01", verplichtVanaf: "2026-11-20" }
    );
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it("heeft een vaste invoerdatum voor de verplichting", () => {
    expect(GECONTROLEERD_VERPLICHT_VANAF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("CLI", () => {
  const script = join(process.cwd(), "scripts", "check-sync-input.mjs");
  const run = (items: unknown) => {
    const dir = mkdtempSync(join(tmpdir(), "sync-input-"));
    const file = join(dir, "input.json");
    writeFileSync(file, JSON.stringify(items));
    return spawnSync("node", [script, file], { encoding: "utf8" });
  };

  it("geeft exit 1 en een leesbare foutmelding bij een duplicaat", () => {
    const today = new Date().toISOString().slice(0, 10);
    const r = run([
      vacature({ gecontroleerdOp: today }),
      vacature({ gecontroleerdOp: today, url: "https://acme.example/jobs/2" }),
    ]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("FOUT [dubbel-vacature]");
    expect(r.stderr).toContain("https://acme.example/jobs/1");
    expect(r.stderr).toContain("https://acme.example/jobs/2");
  });

  it("geeft exit 0 bij geldige input", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(run([vacature({ gecontroleerdOp: today })]).status).toBe(0);
  });
});
