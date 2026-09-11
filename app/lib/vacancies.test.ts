import { afterEach, describe, expect, it, vi } from "vitest";

// vacancies.ts talks to the real firebase/firestore SDK against the `db`
// exported by ~/lib/firebase. Mock both so these are pure unit tests of the
// mapping/call-shape logic, not integration tests against a real project.
vi.mock("~/lib/firebase", () => ({ db: {}, auth: {} }));

const collection = vi.fn((_db, name: string) => ({ __collection: name }));
const doc = vi.fn((_db, name: string, id: string) => ({ __doc: `${name}/${id}` }));
const getDocs = vi.fn();
const setDoc = vi.fn();
const updateDoc = vi.fn();
const deleteField = vi.fn(() => "__DELETE_FIELD__");

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => collection(...(args as [unknown, string])),
  doc: (...args: unknown[]) => doc(...(args as [unknown, string, string])),
  getDocs: (...args: unknown[]) => getDocs(...args),
  setDoc: (...args: unknown[]) => setDoc(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
  deleteField: (...args: unknown[]) => deleteField(...args),
}));

const {
  archiveVacancy,
  createApplication,
  getAllVacancies,
  getApplications,
  getVacanciesDashboard,
  getVacancy,
  markNotInteresting,
  restoreVacancy,
  updateApplication,
} = await import("./vacancies");

function snapshotOf(docs: { id: string; data: Record<string, unknown> }[]) {
  return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) };
}

const rawVacancy = {
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

afterEach(() => {
  vi.clearAllMocks();
});

describe("getAllVacancies", () => {
  it("maps every Firestore doc through vacancyFromFirestore", async () => {
    getDocs.mockResolvedValueOnce(snapshotOf([{ id: "v1", data: rawVacancy }]));

    const result = await getAllVacancies();

    expect(collection).toHaveBeenCalledWith({}, "vacatures");
    expect(result).toEqual([
      expect.objectContaining({ id: "v1", title: "Frontend Developer", status: "new" }),
    ]);
  });

  it("returns an empty array when the read fails", async () => {
    getDocs.mockRejectedValueOnce(new Error("boom"));

    await expect(getAllVacancies()).resolves.toEqual([]);
  });
});

describe("getVacanciesDashboard", () => {
  it("filters out archived vacancies", async () => {
    getDocs.mockResolvedValueOnce(
      snapshotOf([
        { id: "v1", data: rawVacancy },
        { id: "v2", data: { ...rawVacancy, id: "v2", isArchived: true } },
      ])
    );

    const result = await getVacanciesDashboard();

    expect(result?.map((v) => v.id)).toEqual(["v1"]);
  });
});

describe("getVacancy", () => {
  it("finds the vacancy with the matching id", async () => {
    getDocs.mockResolvedValueOnce(
      snapshotOf([
        { id: "v1", data: rawVacancy },
        { id: "v2", data: { ...rawVacancy, id: "v2", titel: "Backend Developer" } },
      ])
    );

    const result = await getVacancy("v2");

    expect(result?.title).toBe("Backend Developer");
  });

  it("returns null when no vacancy matches", async () => {
    getDocs.mockResolvedValueOnce(snapshotOf([{ id: "v1", data: rawVacancy }]));

    await expect(getVacancy("unknown")).resolves.toBeNull();
  });
});

describe("getApplications", () => {
  it("maps every Firestore doc through applicationFromFirestore", async () => {
    getDocs.mockResolvedValueOnce(
      snapshotOf([
        {
          id: "a1",
          data: {
            vacatureId: "v1",
            bedrijf: "Acme BV",
            rol: "Frontend Developer",
            gesolliceerdOp: "2026-01-15",
            status: "gesolliciteerd",
          },
        },
      ])
    );

    const result = await getApplications();

    expect(collection).toHaveBeenCalledWith({}, "sollicitaties");
    expect(result).toEqual([
      {
        id: "a1",
        vacancyId: "v1",
        company: "Acme BV",
        role: "Frontend Developer",
        appliedOn: "2026-01-15",
        status: "applied",
      },
    ]);
  });

  it("returns an empty array when the read fails", async () => {
    getDocs.mockRejectedValueOnce(new Error("boom"));

    await expect(getApplications()).resolves.toEqual([]);
  });
});

describe("createApplication", () => {
  it("writes a Dutch-shaped application doc keyed by company + date, and marks the vacancy applied", async () => {
    await createApplication({
      vacancyId: "v1",
      company: "Acme BV",
      role: "Frontend Developer",
      appliedOn: "2026-03-05",
    });

    expect(doc).toHaveBeenCalledWith({}, "sollicitaties", "acme-bv-2026-03-05");
    expect(setDoc).toHaveBeenCalledWith(
      { __doc: "sollicitaties/acme-bv-2026-03-05" },
      {
        vacatureId: "v1",
        bedrijf: "Acme BV",
        rol: "Frontend Developer",
        gesolliceerdOp: "2026-03-05",
        status: "gesolliciteerd",
      }
    );

    expect(doc).toHaveBeenCalledWith({}, "vacatures", "v1");
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: "vacatures/v1" },
      { status: "gesolliciteerd" }
    );
  });
});

describe("updateApplication", () => {
  it("translates the English status to its Dutch Firestore value", async () => {
    await updateApplication("a1", "interviewing");

    expect(doc).toHaveBeenCalledWith({}, "sollicitaties", "a1");
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: "sollicitaties/a1" },
      { status: "in_gesprek" }
    );
  });
});

describe("archiveVacancy", () => {
  it("updates isArchived as given", async () => {
    await archiveVacancy("v1", true);

    expect(updateDoc).toHaveBeenCalledWith({ __doc: "vacatures/v1" }, { isArchived: true });
  });
});

describe("markNotInteresting", () => {
  it("archives the vacancy with a Dutch status and the given reason", async () => {
    await markNotInteresting("v1", "Te backend-gericht");

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const [target, fields] = updateDoc.mock.calls[0];
    expect(target).toEqual({ __doc: "vacatures/v1" });
    expect(fields).toMatchObject({
      isArchived: true,
      status: "niet-interessant",
      archiefReden: "Te backend-gericht",
    });
    expect(fields.gearchiveerdOp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("restoreVacancy", () => {
  it("clears the archive fields and resets status to viewed", async () => {
    await restoreVacancy("v1");

    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: "vacatures/v1" },
      {
        isArchived: false,
        status: "bekeken",
        archiefReden: "__DELETE_FIELD__",
        gearchiveerdOp: "__DELETE_FIELD__",
      }
    );
  });
});
