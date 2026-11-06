import { describe, expect, it } from "vite-plus/test";
import { canonicalId, documentId, normalizeUrl, sameJobKey } from "./vacancy-keys.mjs";

describe("sameJobKey", () => {
  it("geeft dezelfde sleutel aan dezelfde vacature op twee bronnen (CraftCode)", () => {
    const itJobs = {
      titel: "Lead Front-End Developer",
      bedrijf: "CraftCode (Cronos-groep)",
      locatie: "Edegem (Antwerpen)",
    };
    const codeJobs = {
      titel: "Lead Front-End Developer Edegem",
      bedrijf: "CraftCode (via Cronos)",
      locatie: "Edegem",
    };
    expect(sameJobKey(itJobs)).toBe(sameJobKey(codeJobs));
  });

  it("houdt verschillende rollen bij hetzelfde bedrijf gescheiden", () => {
    const a = { titel: "Front-end Developer", bedrijf: "CraftCode", locatie: "Edegem" };
    const b = { titel: "Full Stack developer", bedrijf: "CraftCode", locatie: "Edegem" };
    expect(sameJobKey(a)).not.toBe(sameJobKey(b));
  });
});

describe("sameJobKey: schrijfwijzen", () => {
  it("herkent full-stack in alle spellingen en negeert (m/v/x)", () => {
    const a = { titel: "Fullstack .NET developer", bedrijf: "LGA IT", locatie: "Kontich" };
    const b = { titel: "Full-Stack .NET Developer (m/v/x)", bedrijf: "LGA IT", locatie: "Kontich" };
    const c = { titel: "Full Stack .NET Developer", bedrijf: "LGA IT", locatie: "Kontich" };
    expect(sameJobKey(a)).toBe(sameJobKey(b));
    expect(sameJobKey(a)).toBe(sameJobKey(c));
  });

  it("herkent front-end en back-end in alle spellingen", () => {
    const a = { titel: "Front End Developer", bedrijf: "X", locatie: "Gent" };
    const b = { titel: "Frontend Developer", bedrijf: "X", locatie: "Gent" };
    expect(sameJobKey(a)).toBe(sameJobKey(b));
    const c = { titel: "Back-end Developer", bedrijf: "X", locatie: "Gent" };
    const d = { titel: "Backend Developer", bedrijf: "X", locatie: "Gent" };
    expect(sameJobKey(c)).toBe(sameJobKey(d));
  });

  it("negeert spaties rond een slash in de titel", () => {
    const a = { titel: "Full Stack Developer (.NET/Angular)", bedrijf: "X", locatie: "Berchem" };
    const b = { titel: "Full Stack Developer (.NET / Angular)", bedrijf: "X", locatie: "Berchem" };
    expect(sameJobKey(a)).toBe(sameJobKey(b));
  });

  it("negeert accenten", () => {
    const a = { titel: "Développeur Front-end", bedrijf: "X", locatie: "Brussel" };
    const b = { titel: "Developpeur Frontend", bedrijf: "X", locatie: "Brussel" };
    expect(sameJobKey(a)).toBe(sameJobKey(b));
  });

  it("houdt rolniveau in de sleutel", () => {
    const lead = { titel: "Lead Front-End Developer", bedrijf: "CraftCode", locatie: "Edegem" };
    const gewoon = { titel: "Front-end Developer", bedrijf: "CraftCode", locatie: "Edegem" };
    const senior = { titel: "Senior Front-end Developer", bedrijf: "CraftCode", locatie: "Edegem" };
    expect(sameJobKey(lead)).not.toBe(sameJobKey(gewoon));
    expect(sameJobKey(senior)).not.toBe(sameJobKey(gewoon));
  });
});

describe("normalizeUrl en canonicalId", () => {
  it("negeert trailing slash, querystring en hoofdletters", () => {
    expect(normalizeUrl("https://Example.com/jobs/1/?utm=a")).toBe("example.com/jobs/1");
    expect(normalizeUrl("https://example.com/jobs/1")).toBe("example.com/jobs/1");
  });

  it("behoudt www als onderdeel van de host", () => {
    expect(normalizeUrl("https://www.vdab.be/vindeenjob/vacatures/1")).toBe(
      "www.vdab.be/vindeenjob/vacatures/1"
    );
  });

  it("houdt Indeed-vacatures met verschillende jk gescheiden", () => {
    const a = canonicalId({ url: "https://be.indeed.com/viewjob?jk=AAA111" });
    const b = canonicalId({ url: "https://be.indeed.com/viewjob?jk=bbb222" });
    expect(a).toBe("be-indeed-com-viewjob-aaa111");
    expect(b).not.toBe(a);
  });

  it("geeft null zonder url", () => {
    expect(canonicalId({})).toBeNull();
    expect(normalizeUrl(undefined)).toBeNull();
  });
});

describe("documentId", () => {
  it("geeft voorrang aan een expliciet id", () => {
    expect(documentId({ id: "indeed-abc", url: "https://x.be/a", bedrijf: "X", titel: "Y" })).toBe("indeed-abc");
  });

  it("valt terug op de url en daarna op bedrijf + titel", () => {
    expect(documentId({ url: "https://x.be/a/", bedrijf: "X", titel: "Y" })).toBe("x-be-a");
    expect(documentId({ bedrijf: "Acme NV", titel: "Front-end" })).toBe("acme-nv-front-end");
  });
});
