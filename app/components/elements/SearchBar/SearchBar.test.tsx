import {describe, expect, it} from "vite-plus/test";
import {render, screen} from "@testing-library/react";
import {SearchBar} from "./SearchBar";

describe("SearchBar", () => {
  it("prefills the query and archived checkbox from the current search", () => {
    render(<SearchBar currentSearch={{q: "react", archived: true}}/>);

    expect(screen.getByRole("searchbox", {name: "Zoek vacatures"})).toHaveValue("react");
    expect(screen.getByRole("checkbox", {name: "Inclusief gearchiveerd"})).toBeChecked();
  });

  it("leaves the archived checkbox unchecked by default", () => {
    render(<SearchBar currentSearch={{}}/>);

    expect(screen.getByRole("checkbox", {name: "Inclusief gearchiveerd"})).not.toBeChecked();
  });

  it("keeps the selected filters as hidden fields, but not the page", () => {
    render(<SearchBar currentSearch={{status: "new", function: "frontend", sort: "date"}} basePath="/custom"/>);

    const form = screen.getByRole("search") as HTMLFormElement;
    expect(form).toHaveAttribute("action", "/custom");
    const data = new FormData(form);
    expect(data.get("status")).toBe("new");
    expect(data.get("function")).toBe("frontend");
    expect(data.get("sort")).toBe("date");
    expect(data.has("source")).toBe(false);
    expect(data.has("page")).toBe(false);
  });
});
