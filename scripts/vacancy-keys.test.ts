import { describe, expect, it } from "vite-plus/test";
import { sameJobKey } from "./vacancy-keys.mjs";

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
