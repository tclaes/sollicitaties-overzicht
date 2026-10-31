import { describe, it, expect, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { StatsCounter } from "./StatsCounter";

const counts = { total: 204, new: 3, viewed: 64, applied: 19, rejected: 0, "not-interesting": 114, "not-hired": 7 };

describe("StatsCounter", () => {
  it("links every counter to its status filter", () => {
    render(<StatsCounter counts={counts} currentSearch={{}} />);

    expect(screen.getByRole("link", { name: /Totaal/ })).toHaveAttribute("href", "/vacatures");
    expect(screen.getByRole("link", { name: /Nieuw/ })).toHaveAttribute("href", "/vacatures?status=new");
    expect(screen.getByRole("link", { name: /Bekeken/ })).toHaveAttribute("href", "/vacatures?status=viewed");
    expect(screen.getByRole("link", { name: /Gesolliciteerd/ })).toHaveAttribute("href", "/vacatures?status=applied");
    expect(screen.getByRole("link", { name: /Niet interessant/ })).toHaveAttribute("href", "/vacatures?status=not-interesting");
    expect(screen.getByRole("link", { name: /Niet aangeworven/ })).toHaveAttribute("href", "/vacatures?status=not-hired");
  });

  it("preserves other params and honours basePath; Totaal clears only the status", () => {
    render(<StatsCounter counts={counts} currentSearch={{ status: "viewed", sort: "date" } as never} basePath="/x" />);

    expect(screen.getByRole("link", { name: /Nieuw/ })).toHaveAttribute("href", "/x?status=new&sort=date");
    expect(screen.getByRole("link", { name: /Totaal/ })).toHaveAttribute("href", "/x?sort=date");
  });

  it("marks the active counter, Totaal when there is no status", () => {
    const { rerender } = render(<StatsCounter counts={counts} currentSearch={{}} />);
    expect(screen.getByRole("link", { name: /Totaal/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /Nieuw/ })).not.toHaveAttribute("aria-current");

    rerender(<StatsCounter counts={counts} currentSearch={{ status: "new" }} />);
    expect(screen.getByRole("link", { name: /Nieuw/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /Totaal/ })).not.toHaveAttribute("aria-current");
  });

  it("scrolls the active counter into view on narrow screens", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<StatsCounter counts={counts} currentSearch={{ status: "applied" }} />);
    expect(scrollIntoView).toHaveBeenCalledWith({ inline: "center", block: "nearest" });
    // @ts-expect-error opruimen van de jsdom-stub
    delete Element.prototype.scrollIntoView;
  });
});
