import {beforeEach, describe, expect, it, vi} from "vite-plus/test";
import {applyTheme, readPreference, resolveTheme, savePreference, THEME_KEY} from "./theme";

function stubMatchMedia(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-color-scheme: dark") ? dark : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
  });

  describe("resolveTheme", () => {
    it("follows the system in auto", () => {
      expect(resolveTheme("auto", true)).toBe("dark");
      expect(resolveTheme("auto", false)).toBe("light");
    });

    it("lets an explicit choice win over the system", () => {
      expect(resolveTheme("light", true)).toBe("light");
      expect(resolveTheme("dark", false)).toBe("dark");
    });
  });

  describe("readPreference / savePreference", () => {
    it("defaults to auto", () => {
      expect(readPreference()).toBe("auto");
    });

    it("round-trips a saved preference", () => {
      savePreference("dark");
      expect(localStorage.getItem(THEME_KEY)).toBe("dark");
      expect(readPreference()).toBe("dark");
    });

    it("falls back to auto for an unknown stored value", () => {
      localStorage.setItem(THEME_KEY, "sepia");
      expect(readPreference()).toBe("auto");
    });

    it("falls back to auto when storage throws", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("denied");
      });
      expect(readPreference()).toBe("auto");
      spy.mockRestore();
    });

    it("does not throw when storage cannot be written", () => {
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("quota");
      });
      expect(() => savePreference("dark")).not.toThrow();
      spy.mockRestore();
    });
  });

  describe("applyTheme", () => {
    it("sets data-theme dark when the system is dark and no preference is saved", () => {
      stubMatchMedia(true);
      applyTheme(readPreference());
      expect(document.documentElement.dataset.theme).toBe("dark");
    });

    it("sets data-theme light when the system is light and no preference is saved", () => {
      stubMatchMedia(false);
      applyTheme(readPreference());
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("applies a saved light preference on a dark system", () => {
      stubMatchMedia(true);
      savePreference("light");
      applyTheme(readPreference());
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    it("updates the theme-color meta tag", () => {
      applyTheme("dark", false);
      expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", "#1c1c1a");
      applyTheme("light", true);
      expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute("content", "#ffffff");
    });
  });
});
