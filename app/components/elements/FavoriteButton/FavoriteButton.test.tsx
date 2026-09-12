import { describe, expect, it, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FavoriteButton } from "./FavoriteButton";

vi.mock("~/lib/vacancies", () => ({
  toggleFavorite: vi.fn().mockResolvedValue(undefined),
}));

describe("FavoriteButton", () => {
  it("marks a non-favorite vacancy as favorite when clicked", async () => {
    const { toggleFavorite } = await import("~/lib/vacancies");
    const onToggled = vi.fn();
    const user = userEvent.setup();

    render(<FavoriteButton id="v1" favorite={false} onToggled={onToggled} />);

    await user.click(screen.getByRole("button", { name: "Markeer als favoriet" }));

    expect(toggleFavorite).toHaveBeenCalledWith("v1", true);
    expect(onToggled).toHaveBeenCalledWith(true);
  });

  it("unmarks a favorite vacancy when clicked", async () => {
    const { toggleFavorite } = await import("~/lib/vacancies");
    const onToggled = vi.fn();
    const user = userEvent.setup();

    render(<FavoriteButton id="v1" favorite={true} onToggled={onToggled} />);

    await user.click(screen.getByRole("button", { name: "Verwijder favoriet" }));

    expect(toggleFavorite).toHaveBeenCalledWith("v1", false);
    expect(onToggled).toHaveBeenCalledWith(false);
  });

  it("stops the click from bubbling up to a parent handler", async () => {
    const { toggleFavorite } = await import("~/lib/vacancies");
    const onParentClick = vi.fn();
    const user = userEvent.setup();

    render(
      <div onClick={onParentClick}>
        <FavoriteButton id="v1" favorite={false} />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Markeer als favoriet" }));

    expect(toggleFavorite).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
