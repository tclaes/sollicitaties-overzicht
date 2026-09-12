import { describe, it, expect } from "vite-plus/test";
import { ApplicationSchema, VacancySchema } from "./schemas";

const validVacancy = {
  id: "v1",
  title: "Frontend Developer",
  company: "Acme BV",
  location: "Hasselt",
  region: "limburg",
  url: "https://example.com/vacature",
  description: "Een leuke rol.",
  source: "indeed",
  dateFound: "2026-03-05T10:00:00.000Z",
  status: "new",
  tags: [],
};

const validApplication = {
  id: "a1",
  company: "Acme BV",
  role: "Frontend Developer",
  appliedOn: "2026-03-05",
  status: "applied",
};

describe("VacancySchema", () => {
  it("accepts a valid vacancy", () => {
    expect(VacancySchema.parse(validVacancy)).toMatchObject({ title: "Frontend Developer" });
  });

  it("defaults status to new when omitted", () => {
    const { status: _status, ...withoutStatus } = validVacancy;
    expect(VacancySchema.parse(withoutStatus).status).toBe("new");
  });

  it("defaults tags to an empty array when omitted", () => {
    const { tags: _tags, ...withoutTags } = validVacancy;
    expect(VacancySchema.parse(withoutTags).tags).toEqual([]);
  });

  it("accepts an empty string or root-relative path as url", () => {
    expect(VacancySchema.parse({ ...validVacancy, url: "" }).url).toBe("");
    expect(VacancySchema.parse({ ...validVacancy, url: "/intern" }).url).toBe("/intern");
  });

  it("rejects a missing required field", () => {
    const { title: _title, ...withoutTitle } = validVacancy;
    expect(() => VacancySchema.parse(withoutTitle)).toThrow();
  });

  it("rejects an invalid region value", () => {
    expect(() => VacancySchema.parse({ ...validVacancy, region: "wallonie" })).toThrow();
  });

  it("rejects an invalid url that isn't empty or root-relative", () => {
    expect(() => VacancySchema.parse({ ...validVacancy, url: "not-a-url" })).toThrow();
  });
});

describe("ApplicationSchema", () => {
  it("accepts a valid application", () => {
    expect(ApplicationSchema.parse(validApplication)).toMatchObject({ company: "Acme BV" });
  });

  it("rejects an appliedOn that isn't YYYY-MM-DD", () => {
    expect(() =>
      ApplicationSchema.parse({ ...validApplication, appliedOn: "05-03-2026" }),
    ).toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() => ApplicationSchema.parse({ ...validApplication, status: "onbekend" })).toThrow();
  });
});
