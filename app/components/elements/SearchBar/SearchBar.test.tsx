import {afterEach, beforeEach, describe, expect, it, vi} from "vite-plus/test";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {SEARCH_DEBOUNCE_MS, SearchBar} from "./SearchBar";

describe("SearchBar", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("prefills the query and archived checkbox from the current search", () => {
    render(<SearchBar currentSearch={{q: "react", archived: true}} onSearch={vi.fn()}/>);

    expect(screen.getByRole("searchbox", {name: "Zoek vacatures"})).toHaveValue("react");
    expect(screen.getByRole("checkbox", {name: "Inclusief gearchiveerd"})).toBeChecked();
  });

  it("does not search on mount", () => {
    const onSearch = vi.fn();
    render(<SearchBar currentSearch={{q: "react"}} onSearch={onSearch}/>);

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);
    });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("searches once the user stops typing", () => {
    const onSearch = vi.fn();
    render(<SearchBar currentSearch={{}} onSearch={onSearch}/>);
    const searchbox = screen.getByRole("searchbox", {name: "Zoek vacatures"});

    fireEvent.change(searchbox, {target: {value: "rea"}});
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 100);
    });
    fireEvent.change(searchbox, {target: {value: "react "}});
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 100);
    });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith({q: "react"});
  });

  it("searches immediately on Enter", () => {
    const onSearch = vi.fn();
    render(<SearchBar currentSearch={{}} onSearch={onSearch}/>);
    const searchbox = screen.getByRole("searchbox", {name: "Zoek vacatures"});

    fireEvent.change(searchbox, {target: {value: "acme"}});
    fireEvent.submit(searchbox);
    expect(onSearch).toHaveBeenCalledWith({q: "acme"});
  });

  it("clears the query when the input is emptied", () => {
    const onSearch = vi.fn();
    render(<SearchBar currentSearch={{q: "react"}} onSearch={onSearch}/>);

    fireEvent.change(screen.getByRole("searchbox", {name: "Zoek vacatures"}), {target: {value: ""}});
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(onSearch).toHaveBeenCalledWith({q: undefined});
  });

  it("toggles archived vacancies", () => {
    const onSearch = vi.fn();
    render(<SearchBar currentSearch={{}} onSearch={onSearch}/>);

    fireEvent.click(screen.getByRole("checkbox", {name: "Inclusief gearchiveerd"}));
    expect(onSearch).toHaveBeenCalledWith({archived: true});
  });
});
