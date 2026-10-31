import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe, expect, it} from "vite-plus/test";

type Tokens = Record<string, string>;

const css = readFileSync(resolve(process.cwd(), "app/styles/tokens.css"), "utf8");

function block(selector: string): Tokens {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Block ${selector} niet gevonden in tokens.css`);
  const end = css.indexOf("\n}", start);
  const tokens: Tokens = {};
  for (const m of css.slice(start, end).matchAll(/(--[\w-]+):\s*([^;]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}

const light = block(":root");
const dark = {...light, ...block('[data-theme="dark"]')};

function channel(hex: string, i: number): number {
  const v = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Verwacht #rrggbb, kreeg ${hex}`);
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const status = ["nieuw", "bekeken", "gesolliciteerd", "afgewezen", "ni", "na"].map(
  (s): [string, string] => [`--color-status-${s}-text`, `--color-status-${s}-bg`],
);
const source = ["indeed", "vdab", "jobat", "linkedin", "andere"].map(
  (s): [string, string] => [`--color-source-${s}-text`, `--color-source-${s}-bg`],
);
const role = ["frontend", "fullstack"].map((s): [string, string] => [`--color-role-${s}-text`, `--color-role-${s}-bg`]);
const badge = ["success", "warning", "danger", "purple"].map(
  (s): [string, string] => [`--color-badge-${s}-text`, `--color-badge-${s}-bg`],
);

/** Tekst/achtergrond-paren die ≥ 4,5:1 moeten halen (WCAG AA, normale tekst). */
const textPairs: Array<[string, string]> = [
  ["--color-text", "--color-bg"],
  ["--color-text", "--color-surface"],
  ["--color-text-muted", "--color-bg"],
  ["--color-text-muted", "--color-surface"],
  ["--color-text-subtle", "--color-surface"],
  ["--color-accent", "--color-surface"],
  ["--color-accent-hover", "--color-surface"],
  ["--color-accent-text", "--color-accent-subtle"],
  ["--color-text-inverse", "--color-accent-solid"],
  ["--color-text-inverse", "--color-accent-solid-hover"],
  ["--color-danger-text", "--color-surface"],
  ...status,
  ...source,
  ...role,
  ...badge,
];

/** Niet-tekst (rand, focusring, statusstip) tegenover het oppervlak: ≥ 3:1 (WCAG 1.4.11). */
const nonTextPairs: Array<[string, string]> = [["--color-accent", "--color-surface"]];

function failures(tokens: Tokens, pairs: Array<[string, string]>, min: number): string[] {
  return pairs.flatMap(([fg, bg]) => {
    if (!tokens[fg] || !tokens[bg]) return [`${fg} / ${bg}: token ontbreekt`];
    const ratio = contrast(tokens[fg], tokens[bg]);
    return ratio >= min ? [] : [`${fg} (${tokens[fg]}) op ${bg} (${tokens[bg]}): ${ratio.toFixed(2)}:1 < ${min}:1`];
  });
}

describe("dark theme tokens", () => {
  it("every text/background pair reaches 4.5:1", () => {
    expect(failures(dark, textPairs, 4.5)).toEqual([]);
  });

  it("accent as border/outline reaches 3:1 on the surface", () => {
    expect(failures(dark, nonTextPairs, 3)).toEqual([]);
  });

  it("accent works both as text and as button fill (separate tokens)", () => {
    expect(contrast(dark["--color-accent"], dark["--color-surface"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(dark["--color-text-inverse"], dark["--color-accent-solid"])).toBeGreaterThanOrEqual(4.5);
  });

  it("overrides every colour token defined in :root, except the intentionally shared ones", () => {
    const shared = new Set([
      "--color-text-inverse",
      "--color-accent-solid",
      "--color-accent-solid-hover",
    ]);
    const overridden = block('[data-theme="dark"]');
    const missing = Object.keys(light).filter(
      (name) => name.startsWith("--color-") && !shared.has(name) && !(name in overridden),
    );
    expect(missing).toEqual([]);
  });
});

describe("light theme tokens (regressienet)", () => {
  it("button fill keeps readable text", () => {
    expect(failures(light, [["--color-text-inverse", "--color-accent-solid"]], 4.5)).toEqual([]);
  });

  it("primary and muted text stay readable", () => {
    expect(
      failures(
        light,
        textPairs.filter(([fg]) => ["--color-text", "--color-text-muted", "--color-accent-text"].includes(fg)),
        4.5,
      ),
    ).toEqual([]);
  });
});
