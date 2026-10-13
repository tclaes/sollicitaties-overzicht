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

  it("flips the archived checkbox immediately, before the route applies the search", () => {
    render(<SearchBar currentSearch={{}} onSearch={vi.fn()}/>);
    const checkbox = screen.getByRole("checkbox", {name: "Inclusief gearchiveerd"});

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("follows the URL when it changes outside the input (Back/Forward) without searching again", () => {
    const onSearch = vi.fn();
    const {rerender} = render(<SearchBar currentSearch={{q: "foo"}} onSearch={onSearch}/>);
    const searchbox = screen.getByRole("searchbox", {name: "Zoek vacatures"});

    rerender(<SearchBar currentSearch={{}} onSearch={onSearch}/>);
    expect(searchbox).toHaveValue("");

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);
    });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does not overwrite what the user is typing when its own search comes back", () => {
    const onSearch = vi.fn();
    const {rerender} = render(<SearchBar currentSearch={{}} onSearch={onSearch}/>);
    const searchbox = screen.getByRole("searchbox", {name: "Zoek vacatures"});

    fireEvent.change(searchbox, {target: {value: "foo"}});
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(onSearch).toHaveBeenCalledWith({q: "foo"});

    // De gebruiker typt verder terwijl de loader nog bezig is...
    fireEvent.change(searchbox, {target: {value: "foob"}});
    // ...en dan komt de URL van de eerste zoekopdracht binnen.
    rerender(<SearchBar currentSearch={{q: "foo"}} onSearch={onSearch}/>);
    expect(searchbox).toHaveValue("foob");
  });
});
