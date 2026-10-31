export type ThemePreference = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "vacature-theme";
export const THEME_PREFERENCES: readonly ThemePreference[] = ["auto", "light", "dark"];
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Kleur van de browser-adresbalk (`theme-color`) per thema; gelijk aan `--color-surface`. */
export const THEME_COLOR: Record<ResolvedTheme, string> = {light: "#ffffff", dark: "#1c1c1a"};

function isPreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

/** Leest de bewaarde voorkeur; ontbrekend, ongeldig of onbereikbaar storage valt terug op `auto`. */
export function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return isPreference(value) ? value : "auto";
  } catch {
    return "auto";
  }
}

export function savePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    // storage niet beschikbaar (privémodus): de keuze geldt dan enkel voor deze sessie
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === "auto") return systemDark ? "dark" : "light";
  return preference;
}

/** Zet het effectieve thema op `<html>` en synchroniseert `theme-color`. */
export function applyTheme(preference: ThemePreference, systemDark: boolean = systemPrefersDark()): ResolvedTheme {
  const theme = resolveTheme(preference, systemDark);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  return theme;
}
