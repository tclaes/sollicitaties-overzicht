import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when everything fits on one page", () => {
    const { container } = render(
      <Pagination totalItems={5} currentPage={1} basePath="/" currentSearch={{}} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders page links with prev/next around the current page", () => {
    render(
      <Pagination totalItems={100} currentPage={3} basePath="/vacatures" currentSearch={{}} />
    );

    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/vacatures?page=1");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volgende" })).toHaveAttribute(
      "href",
      "/vacatures?page=4"
    );
    expect(screen.getByRole("link", { name: "Vorige" })).toHaveAttribute(
      "href",
      "/vacatures?page=2"
    );
  });

  it("does not show Volgende on the last page", () => {
    render(
      <Pagination totalItems={60} currentPage={3} basePath="/" currentSearch={{}} />
    );

    expect(screen.queryByRole("link", { name: "Volgende" })).not.toBeInTheDocument();
  });

  it("does not show Vorige on the first page", () => {
    render(
      <Pagination totalItems={60} currentPage={1} basePath="/" currentSearch={{}} />
    );

    expect(screen.queryByRole("link", { name: "Vorige" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volgende" })).toHaveAttribute("href", "/?page=2");
  });

  it("preserves the current search params in page links", () => {
    render(
      <Pagination
        totalItems={60}
        currentPage={2}
        basePath="/"
        currentSearch={{ status: "new", sort: "date" }}
      />
    );

    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute(
      "href",
      "/?status=new&sort=date&page=1"
    );
    expect(screen.getByRole("link", { name: "Volgende" })).toHaveAttribute(
      "href",
      "/?status=new&sort=date&page=3"
    );
  });
});