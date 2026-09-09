import { describe, it, expect } from "vitest";
import { ApplicationSchema, VacancySchema } from "./schemas";

const validVacancy = {
  id: "v1",
  titel: "Frontend Developer",
  bedrijf: "Acme BV",
  locatie: "Hasselt",
  regio: "limburg",
  url: "https://example.com/vacature",
  beschrijving: "Een leuke rol.",
  bron: "indeed",
  gevondenOp: "2026-03-05T10:00:00.000Z",
  status: "nieuw",
  tags: [],
};

const validApplication = {
  id: "a1",
  bedrijf: "Acme BV",
  rol: "Frontend Developer",
  gesolliceerdOp: "2026-03-05",
  status: "gesolliciteerd",
};

describe("VacancySchema", () => {
  it("accepts a valid vacancy", () => {
    expect(VacancySchema.parse(validVacancy)).toMatchObject({ titel: "Frontend Developer" });
  });

  it("defaults status to nieuw when omitted", () => {
    const { status, ...withoutStatus } = validVacancy;
    expect(VacancySchema.parse(withoutStatus).status).toBe("nieuw");
  });

  it("defaults tags to an empty array when omitted", () => {
    const { tags, ...withoutTags } = validVacancy;
    expect(VacancySchema.parse(withoutTags).tags).toEqual([]);
  });

  it("accepts an empty string or root-relative path as url", () => {
    expect(VacancySchema.parse({ ...validVacancy, url: "" }).url).toBe("");
    expect(VacancySchema.parse({ ...validVacancy, url: "/intern" }).url).toBe("/intern");
  });

  it("rejects a missing required field", () => {
    const { titel, ...withoutTitel } = validVacancy;
    expect(() => VacancySchema.parse(withoutTitel)).toThrow();
  });

  it("rejects an invalid regio value", () => {
    expect(() => VacancySchema.parse({ ...validVacancy, regio: "wallonie" })).toThrow();
  });

  it("rejects an invalid url that isn't empty or root-relative", () => {
    expect(() => VacancySchema.parse({ ...validVacancy, url: "not-a-url" })).toThrow();
  });
});

describe("ApplicationSchema", () => {
  it("accepts a valid application", () => {
    expect(ApplicationSchema.parse(validApplication)).toMatchObject({ bedrijf: "Acme BV" });
  });

  it("rejects a gesolliceerdOp that isn't YYYY-MM-DD", () => {
    expect(() => ApplicationSchema.parse({ ...validApplication, gesolliceerdOp: "05-03-2026" })).toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() => ApplicationSchema.parse({ ...validApplication, status: "onbekend" })).toThrow();
  });
});
