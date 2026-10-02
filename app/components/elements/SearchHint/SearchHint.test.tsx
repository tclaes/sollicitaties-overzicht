import {describe, expect, it, vi} from "vite-plus/test";
import {fireEvent, render, screen} from "@testing-library/react";
import {SearchHint} from "./SearchHint";

function renderHint(canIncludeArchived: boolean, outsideFiltersCount: number) {
  const onIncludeArchived = vi.fn();
  const onClearFilters = vi.fn();
  render(
    <SearchHint
      query="jstack"
      canIncludeArchived={canIncludeArchived}
      outsideFiltersCount={outsideFiltersCount}
      onIncludeArchived={onIncludeArchived}
      onClearFilters={onClearFilters}
    />,
  );
  return {onIncludeArchived, onClearFilters};
}

describe("SearchHint", () => {
  it("says nothing was found when there are no hidden matches", () => {
    renderHint(false, 0);
    expect(screen.getByRole("status")).toHaveTextContent("Niets gevonden voor “jstack”.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers to include archived vacancies", () => {
    const {onIncludeArchived} = renderHint(true, 0);
    expect(screen.getByRole("status")).toHaveTextContent("Mogelijk zijn er matches voor “jstack” in het archief.");

    fireEvent.click(screen.getByRole("button", {name: "Inclusief gearchiveerd tonen"}));
    expect(onIncludeArchived).toHaveBeenCalled();
  });

  it("offers to clear the filters", () => {
    const {onClearFilters} = renderHint(false, 2);
    expect(screen.getByRole("status")).toHaveTextContent("2 vacatures matchen “jstack” buiten de huidige filters.");

    fireEvent.click(screen.getByRole("button", {name: "Filters wissen"}));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
