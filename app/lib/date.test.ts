import { describe, it, expect, vi, afterEach } from "vite-plus/test";
import { formatDate, todayIso } from "./date";

describe("todayIso", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns today's date as YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T10:00:00Z"));
    expect(todayIso()).toBe("2026-03-05");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string in Dutch (Belgium)", () => {
    expect(formatDate("2026-03-05")).toBe("donderdag 5 maart 2026");
  });
});
