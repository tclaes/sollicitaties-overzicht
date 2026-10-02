import { afterEach, describe, expect, it, vi } from "vite-plus/test";

// vacancies.ts talks to the real firebase/firestore SDK against the `db`
// exported by ~/lib/firebase. Mock both so these are pure unit tests of the
// mapping/call-shape logic, not integration tests against a real project.
vi.mock("~/lib/firebase", () => ({ db: {}, auth: {} }));

const collection = vi.fn((_db, name: string) => ({ __collection: name }));
const doc = vi.fn((_db, name: string, id: string) => ({ __doc: `${name}/${id}` }));
const getDocs = vi.fn();
const getDoc = vi.fn();
const getCountFromServer = vi.fn();
const query = vi.fn((ref: unknown, ...constraints: unknown[]) => ({ __query: ref, constraints }));
const where = vi.fn((field: string, op: string, value: unknown) => ({ field, op, value }));
const setDoc = vi.fn();
const updateDoc = vi.fn();
const deleteField = vi.fn(() => "__DELETE_FIELD__");

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => collection(...(args as [unknown, string])),
  doc: (...args: unknown[]) => doc(...(args as [unknown, string, string])),
  getDocs: (...args: unknown[]) => getDocs(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getCountFromServer: (...args: unknown[]) => getCountFromServer(...args),
  query: (...args: unknown[]) => query(...(args as [unknown, ...unknown[]])),
  where: (...args: unknown[]) => where(...(args as [string, string, unknown])),
  setDoc: (...args: unknown[]) => setDoc(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
  deleteField: () => deleteField(),
}));

const {
  archiveVacancy,
  createApplication,
  getActiveVacancies,
  getArchivedVacancies,
  getVacancyCounts,
  getApplications,
  getVacancy,
  markNotInteresting,
  restoreVacancy,
  toggleFavorite,
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

describe("getActiveVacancies", () => {
  it("queries everything that is not archived and maps it through vacancyFromFirestore", async () => {
    getDocs.mockResolvedValueOnce(snapshotOf([{ id: "v1", data: rawVacancy }]));

    const result = await getActiveVacancies();

    expect(collection).toHaveBeenCalledWith({}, "vacatures");
    expect(where).toHaveBeenCalledWith("status", "not-in", ["niet-interessant", "niet-aangeworven"]);
    expect(result).toEqual([
      expect.objectContaining({ id: "v1", title: "Frontend Developer", status: "new" }),
    ]);
  });

  it("returns an empty array when the read fails", async () => {
    getDocs.mockRejectedValueOnce(new Error("boom"));

    await expect(getActiveVacancies()).resolves.toEqual([]);
  });
});

describe("getArchivedVacancies", () => {
  it("only queries archived documents", async () => {
    getDocs.mockResolvedValueOnce(
      snapshotOf([{ id: "v1", data: { ...rawVacancy, isArchived: true, status: "niet-interessant" } }]),
    );

    const result = await getArchivedVacancies();

    expect(where).toHaveBeenCalledWith("isArchived", "==", true);
    expect(result).toEqual([expect.objectContaining({ id: "v1", isArchived: true })]);
  });

  it("returns an empty array when the read fails", async () => {
    getDocs.mockRejectedValueOnce(new Error("boom"));

    await expect(getArchivedVacancies()).resolves.toEqual([]);
  });
});

describe("getVacancyCounts", () => {
  it("counts the total and every status on the server", async () => {
    getCountFromServer.mockImplementation(async (ref: { constraints?: { value: string }[] }) => {
      const status = ref.constraints?.[0]?.value;
      const counts: Record<string, number> = { nieuw: 4, bekeken: 3, gesolliciteerd: 2, "niet-interessant": 5 };
      return { data: () => ({ count: status ? (counts[status] ?? 0) : 20 }) };
    });

    await expect(getVacancyCounts()).resolves.toEqual({
      total: 20,
      new: 4,
      viewed: 3,
      applied: 2,
      rejected: 0,
      "not-interesting": 5,
      "not-hired": 0,
    });
  });

  it("returns zero counts when the read fails", async () => {
    getCountFromServer.mockRejectedValue(new Error("boom"));

    await expect(getVacancyCounts()).resolves.toMatchObject({ total: 0, new: 0 });
  });
});

describe("getVacancy", () => {
  it("reads the single document by id", async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      id: "v2",
      data: () => ({ ...rawVacancy, id: "v2", titel: "Backend Developer" }),
    });

    const result = await getVacancy("v2");

    expect(doc).toHaveBeenCalledWith({}, "vacatures", "v2");
    expect(result?.title).toBe("Backend Developer");
  });

  it("returns null when the document does not exist", async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });

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
      ]),
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
      },
    );

    expect(doc).toHaveBeenCalledWith({}, "vacatures", "v1");
    expect(updateDoc).toHaveBeenCalledWith({ __doc: "vacatures/v1" }, { status: "gesolliciteerd" });
  });
});

describe("updateApplication", () => {
  it("translates the English status to its Dutch Firestore value", async () => {
    await updateApplication("a1", "interviewing");

    expect(doc).toHaveBeenCalledWith({}, "sollicitaties", "a1");
    expect(updateDoc).toHaveBeenCalledWith({ __doc: "sollicitaties/a1" }, { status: "in_gesprek" });
  });
});

describe("archiveVacancy", () => {
  it("also sets the vacancy status to not-hired when archiving", async () => {
    await archiveVacancy("v1", true);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const [target, fields] = updateDoc.mock.calls[0];
    expect(target).toEqual({ __doc: "vacatures/v1" });
    expect(fields).toMatchObject({
      isArchived: true,
      status: "niet-aangeworven",
      archiefReden: "Niet aangenomen na sollicitatie",
    });
    expect(fields.gearchiveerdOp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("only updates isArchived when un-archiving", async () => {
    await archiveVacancy("v1", false);

    expect(updateDoc).toHaveBeenCalledWith({ __doc: "vacatures/v1" }, { isArchived: false });
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

  it("archives an applied vacancy as not-hired instead of not-interesting", async () => {
    await markNotInteresting("v1", "Toch niet aangenomen", "applied");

    const [, fields] = updateDoc.mock.calls[0];
    expect(fields).toMatchObject({
      isArchived: true,
      status: "niet-aangeworven",
      archiefReden: "Toch niet aangenomen",
    });
  });
});

describe("toggleFavorite", () => {
  it("writes the Dutch favoriet field", async () => {
    await toggleFavorite("v1", true);

    expect(updateDoc).toHaveBeenCalledWith({ __doc: "vacatures/v1" }, { favoriet: true });
  });

  it("can unset the favorite flag", async () => {
    await toggleFavorite("v1", false);

    expect(updateDoc).toHaveBeenCalledWith({ __doc: "vacatures/v1" }, { favoriet: false });
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
      },
    );
  });

  it("resets status to applied when restoring a not-hired vacancy", async () => {
    await restoreVacancy("v1", true);

    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: "vacatures/v1" },
      expect.objectContaining({ status: "gesolliciteerd" }),
    );
  });
});
