import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {beforeEach, describe, expect, it} from "vite-plus/test";
import {applyTheme, readPreference, savePreference, THEME_KEY} from "./theme";
import type {ThemePreference} from "./theme";

// Het inline script in index.html draait vóór de bundel en dupliceert de leeslogica van theme.ts.
// Deze test voert de echte scripttekst uit en vergelijkt met theme.ts zodat ze niet uit elkaar lopen.
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";

/** Voert het inline script uit zoals de browser dat doet; bewust een dynamische uitvoering van onze eigen index.html. */
function runScript() {
  // oxlint-disable-next-line typescript/no-implied-eval
  new Function(script)();
}

function setSystem(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-color-scheme: dark") ? dark : false,
    media: query,
  })) as unknown as typeof window.matchMedia;
}

function reset() {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
}

const cases: Array<[string | null, boolean]> = [
  [null, true],
  [null, false],
  ["auto", true],
  ["light", true],
  ["dark", false],
  ["sepia", true],
  ["sepia", false],
];

describe("inline theme script in index.html", () => {
  beforeEach(reset);

  it("is present and declares color-scheme and theme-color", () => {
    expect(script).toContain("vacature-theme");
    expect(html).toContain('name="color-scheme"');
    expect(html).toContain('name="theme-color"');
  });

  it("runs before the app root", () => {
    expect(html.indexOf("<script>")).toBeLessThan(html.indexOf('id="root"'));
  });

  it.each(cases)("matches theme.ts for stored=%s, system dark=%s", (stored, systemDark) => {
    setSystem(systemDark);
    if (stored !== null) localStorage.setItem(THEME_KEY, stored);

    runScript();
    const fromScript = document.documentElement.dataset.theme;
    const metaScript = document.querySelector('meta[name="theme-color"]')?.getAttribute("content");

    reset();
    setSystem(systemDark);
    if (stored !== null) localStorage.setItem(THEME_KEY, stored);
    applyTheme(readPreference());

    expect(fromScript).toBe(document.documentElement.dataset.theme);
    expect(metaScript).toBe(document.querySelector('meta[name="theme-color"]')?.getAttribute("content"));
  });

  it("sets dark before React mounts when dark is saved", () => {
    setSystem(false);
    savePreference("dark" as ThemePreference);
    runScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("does not throw when localStorage is unavailable", () => {
    setSystem(true);
    const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {configurable: true, get() { throw new Error("denied"); }});
    try {
      expect(runScript).not.toThrow();
      expect(document.documentElement.dataset.theme).toBe("dark");
    } finally {
      Object.defineProperty(window, "localStorage", original);
    }
  });
});
