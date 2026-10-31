import {act, renderHook} from "@testing-library/react";
import {beforeEach, describe, expect, it} from "vite-plus/test";
import {THEME_KEY} from "./theme";
import {useTheme} from "./useTheme";

type Listener = () => void;

function stubSystem(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<Listener>();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes("prefers-color-scheme: dark") ? dark : false;
    },
    media: query,
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      dark = next;
      listeners.forEach((l) => l());
    },
    listenerCount: () => listeners.size,
  };
}

const theme = () => document.documentElement.dataset.theme;

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts in auto and follows the system", () => {
    stubSystem(true);
    const {result} = renderHook(() => useTheme());
    expect(result.current[0]).toBe("auto");
    expect(theme()).toBe("dark");
  });

  it("applies and saves an explicit choice", () => {
    stubSystem(true);
    const {result} = renderHook(() => useTheme());
    act(() => result.current[1]("light"));
    expect(result.current[0]).toBe("light");
    expect(theme()).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
  });

  it("restores a saved preference", () => {
    stubSystem(false);
    localStorage.setItem(THEME_KEY, "dark");
    const {result} = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");
    expect(theme()).toBe("dark");
  });

  it("reacts to system changes in auto without a reload", () => {
    const system = stubSystem(false);
    renderHook(() => useTheme());
    expect(theme()).toBe("light");
    act(() => system.set(true));
    expect(theme()).toBe("dark");
  });

  it("ignores system changes with an explicit choice and stops listening", () => {
    const system = stubSystem(false);
    const {result} = renderHook(() => useTheme());
    expect(system.listenerCount()).toBe(1);
    act(() => result.current[1]("light"));
    expect(system.listenerCount()).toBe(0);
    act(() => system.set(true));
    expect(theme()).toBe("light");
  });
});
