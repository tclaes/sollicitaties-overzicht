import { describe, it, expect } from "vite-plus/test";
import { applicationFromFirestore, vacancyFromFirestore } from "./firestoreMappers";

describe("vacancyFromFirestore", () => {
  const rawVacancy = {
    id: "v1",
    titel: "Frontend Developer",
    bedrijf: "Acme BV",
    locatie: "Hasselt",
    regio: "vlaanderen",
    url: "https://example.com/vacature",
    beschrijving: "Een leuke rol.",
    bron: "andere",
    functie: "frontend",
    gevondenOp: "2026-03-05T10:00:00.000Z",
    status: "nieuw",
    tags: ["React"],
    match: { score: "sterk", toelichting: "Sterke match." },
  };

  it("maps Dutch Firestore field names and enum values to the English schema", () => {
    expect(vacancyFromFirestore(rawVacancy)).toEqual({
      id: "v1",
      title: "Frontend Developer",
      company: "Acme BV",
      location: "Hasselt",
      region: "flanders",
      url: "https://example.com/vacature",
      description: "Een leuke rol.",
      source: "other",
      function: "frontend",
      dateFound: "2026-03-05T10:00:00.000Z",
      status: "new",
      tags: ["React"],
      match: { score: "strong", explanation: "Sterke match." },
    });
  });

  it("maps an archived vacancy's status, reason and archive date", () => {
    const archived = {
      ...rawVacancy,
      status: "niet-interessant",
      isArchived: true,
      archiefReden: "Te backend-gericht",
      gearchiveerdOp: "2026-04-01T09:00:00.000Z",
    };

    const mapped = vacancyFromFirestore(archived);

    expect(mapped.status).toBe("not-interesting");
    expect(mapped.isArchived).toBe(true);
    expect(mapped.archiveReason).toBe("Te backend-gericht");
    expect(mapped.dateArchived).toBe("2026-04-01T09:00:00.000Z");
  });

  it("maps the Dutch favoriet field to favorite", () => {
    const mapped = vacancyFromFirestore({ ...rawVacancy, favoriet: true });
    expect(mapped.favorite).toBe(true);
  });

  it("throws when the mapped document doesn't satisfy the schema", () => {
    const { titel: _titel, ...withoutTitel } = rawVacancy;
    expect(() => vacancyFromFirestore(withoutTitel)).toThrow();
  });
});

describe("applicationFromFirestore", () => {
  it("maps Dutch Firestore field names and enum values to the English schema", () => {
    const raw = {
      id: "a1",
      vacatureId: "v1",
      bedrijf: "Acme BV",
      rol: "Frontend Developer",
      gesolliceerdOp: "2026-03-05",
      status: "in_gesprek",
      notitie: "Tweede gesprek gepland",
    };

    expect(applicationFromFirestore(raw)).toEqual({
      id: "a1",
      vacancyId: "v1",
      company: "Acme BV",
      role: "Frontend Developer",
      appliedOn: "2026-03-05",
      status: "interviewing",
      note: "Tweede gesprek gepland",
    });
  });
});
