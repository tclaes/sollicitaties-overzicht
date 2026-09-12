import { describe, it, expect, beforeEach, vi } from "vite-plus/test";

// getApplicationDate/setApplicationDate are pure localStorage helpers, but this
// file transitively imports ~/lib/firebase (for the Firestore-backed functions
// in the same module), which initializes Firebase Auth at import time — mock it
// so these tests don't need real Firebase config.
vi.mock("~/lib/firebase", () => ({ db: {}, auth: {} }));

import { getApplicationDate, setApplicationDate } from "./statusStore";

describe("getApplicationDate / setApplicationDate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns undefined when nothing is stored for the id", () => {
    expect(getApplicationDate("unknown-id")).toBeUndefined();
  });

  it("round-trips a date through localStorage", () => {
    setApplicationDate("vacancy-1", "2026-03-05");
    expect(getApplicationDate("vacancy-1")).toBe("2026-03-05");
  });

  it("keeps dates for different ids independent", () => {
    setApplicationDate("vacancy-1", "2026-03-05");
    setApplicationDate("vacancy-2", "2026-04-01");

    expect(getApplicationDate("vacancy-1")).toBe("2026-03-05");
    expect(getApplicationDate("vacancy-2")).toBe("2026-04-01");
  });

  it("returns undefined when localStorage holds invalid JSON", () => {
    localStorage.setItem("vacature-sollicitaties", "not-json");
    expect(getApplicationDate("vacancy-1")).toBeUndefined();
  });
});
