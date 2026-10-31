import {useCallback, useEffect, useState} from "react";
import {applyTheme, DARK_QUERY, readPreference, savePreference} from "./theme";
import type {ThemePreference} from "./theme";

/** Houdt de themavoorkeur bij, past ze toe op `<html>` en volgt het systeemthema in stand `auto`. */
export function useTheme(): [ThemePreference, (preference: ThemePreference) => void] {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== "auto" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("auto", mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    savePreference(next);
    setPreferenceState(next);
  }, []);

  return [preference, setPreference];
}
