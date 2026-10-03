import {afterEach, beforeEach, describe, expect, it, vi} from "vite-plus/test";
import {act, renderHook} from "@testing-library/react";
import {useInfiniteList} from "./useInfiniteList";
import {PAGE_SIZE} from "./schemas";

const items = Array.from({length: PAGE_SIZE * 3 + 5}, (_, i) => i);

let triggerIntersect: () => void;
let observers: { disconnect: ReturnType<typeof vi.fn> }[];

class FakeObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    triggerIntersect = () => callback([{isIntersecting: true}]);
    observers.push(this);
  }
}

beforeEach(() => {
  observers = [];
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal("requestIdleCallback", undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setup(key = "a", list = items) {
  const view = renderHook(({k}) => useInfiniteList(list, k), {initialProps: {k: key}});
  act(() => view.result.current.sentinelRef(document.createElement("div")));
  return view;
}

describe("useInfiniteList", () => {
  it("starts with the first chunk", () => {
    const {result} = setup();
    expect(result.current.items).toHaveLength(PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);
  });

  it("loads the next chunk when the sentinel intersects", () => {
    const {result} = setup();
    act(() => triggerIntersect());
    expect(result.current.items).toHaveLength(PAGE_SIZE * 2);
  });

  it("prefetches one chunk ahead when idle, and only one", () => {
    const {result} = setup();
    act(() => void vi.advanceTimersByTime(500));
    expect(result.current.items).toHaveLength(PAGE_SIZE * 2);
    act(() => void vi.advanceTimersByTime(5000));
    expect(result.current.items).toHaveLength(PAGE_SIZE * 2);
  });

  it("stops at the end of the list", () => {
    const {result} = setup();
    for (let i = 0; i < 5; i++) act(() => {
      triggerIntersect();
      vi.advanceTimersByTime(500);
    });
    expect(result.current.items).toHaveLength(items.length);
    expect(result.current.hasMore).toBe(false);
  });

  it("resets when the key changes", () => {
    const {result, rerender} = setup("a");
    act(() => triggerIntersect());
    rerender({k: "b"});
    expect(result.current.items).toHaveLength(PAGE_SIZE);
  });

  it("restores the loaded count for a known key", () => {
    const first = setup("a");
    act(() => triggerIntersect());
    first.unmount();

    const {result} = setup("a");
    expect(result.current.items).toHaveLength(PAGE_SIZE * 2);
  });

  it("reports missing IntersectionObserver support", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const {result} = renderHook(() => useInfiniteList(items, "a"));
    expect(result.current.supportsObserver).toBe(false);
    act(() => result.current.loadMore());
    expect(result.current.items).toHaveLength(PAGE_SIZE * 2);
  });
});
