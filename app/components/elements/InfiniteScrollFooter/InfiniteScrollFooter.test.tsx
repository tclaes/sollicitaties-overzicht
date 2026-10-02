import {describe, expect, it, vi} from "vite-plus/test";
import {fireEvent, render, screen} from "@testing-library/react";
import {InfiniteScrollFooter} from "./InfiniteScrollFooter";

function renderFooter(overrides: Partial<React.ComponentProps<typeof InfiniteScrollFooter>> = {}) {
  const onLoadMore = vi.fn();
  render(
    <InfiniteScrollFooter
      hasMore
      loadedCount={25}
      totalCount={60}
      supportsObserver
      sentinelRef={() => {}}
      onLoadMore={onLoadMore}
      {...overrides}
    />,
  );
  return {onLoadMore};
}

describe("InfiniteScrollFooter", () => {
  it("shows progress while there is more to load", () => {
    renderFooter();
    expect(screen.getByRole("status")).toHaveTextContent("25 van 60 vacatures geladen");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says everything is loaded at the end", () => {
    renderFooter({hasMore: false, loadedCount: 60});
    expect(screen.getByRole("status")).toHaveTextContent("Alle vacatures geladen");
  });

  it("falls back to a button without IntersectionObserver", () => {
    const {onLoadMore} = renderFooter({supportsObserver: false});
    fireEvent.click(screen.getByRole("button", {name: "Meer laden"}));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("renders nothing for an empty list", () => {
    renderFooter({totalCount: 0, loadedCount: 0, hasMore: false});
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
