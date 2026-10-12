import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { FilterPills } from "./FilterPills";

describe("FilterPills", () => {
  it("renders every filter group", () => {
    render(<FilterPills currentSearch={{}} />);

    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.getByText("Functie")).toBeInTheDocument();
    expect(screen.getByText("Sortering")).toBeInTheDocument();
    expect(screen.getByText("Bron")).toBeInTheDocument();
  });

  it("builds hrefs against basePath, merging in the current search", () => {
    render(<FilterPills currentSearch={{ status: "viewed" }} basePath="/custom-base" />);

    const link = screen.getByRole("link", { name: "frontend" });
    expect(link).toHaveAttribute("href", "/custom-base?status=viewed&function=frontend");
  });

  it("defaults basePath to /vacatures", () => {
    render(<FilterPills currentSearch={{}} />);

    const frontendLink = screen.getByRole("link", { name: "frontend" });
    expect(frontendLink).toHaveAttribute("href", "/vacatures?function=frontend");
  });

  it("preserves other search params when changing one filter", () => {
    render(<FilterPills currentSearch={{ status: "viewed", sort: "date" }} basePath="/custom-base" />);

    const frontendLink = screen.getByRole("link", { name: "frontend" });
    expect(frontendLink).toHaveAttribute("href", "/custom-base?status=viewed&sort=date&function=frontend");
  });
});
