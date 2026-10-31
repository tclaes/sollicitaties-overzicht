import {afterEach, describe, expect, it, vi} from "vite-plus/test";
import {act, renderHook} from "@testing-library/react";
import {useMediaQuery} from "./useMediaQuery";

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: initial,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
  return {
    set(next: boolean) {
      mql.matches = next;
      listeners.forEach((l) => l());
    },
  };
}

describe("useMediaQuery", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the initial match synchronously", () => {
    mockMatchMedia(true);
    const {result} = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const mm = mockMatchMedia(false);
    const {result} = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(false);
    act(() => mm.set(true));
    expect(result.current).toBe(true);
  });
});
