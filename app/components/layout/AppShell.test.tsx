import {describe, expect, it, vi} from "vite-plus/test";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AppShell} from "./AppShell";

vi.mock("~/lib/auth", () => ({logout: vi.fn()}));

function setup() {
  render(<AppShell><p>inhoud</p></AppShell>);
  return {
    user: userEvent.setup(),
    button: screen.getByRole("button", {name: "Menu"}),
  };
}

describe("AppShell navigation drawer", () => {
  it("has an accessible menu button that starts collapsed", () => {
    const {button} = setup();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "hoofdnavigatie");
    expect(screen.queryByTestId("nav-backdrop")).not.toBeInTheDocument();
  });

  it("opens the drawer, shows a backdrop and focuses the first link", async () => {
    const {user, button} = setup();
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("nav-backdrop")).toBeInTheDocument();
    expect(screen.getByRole("link", {name: "Vacatures", hidden: true})).toHaveFocus();
  });

  it("closes on Escape and returns focus to the menu button", async () => {
    const {user, button} = setup();
    await user.click(button);
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes when the backdrop is clicked", async () => {
    const {user, button} = setup();
    await user.click(button);
    await user.click(screen.getByTestId("nav-backdrop"));
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes when a navigation link is chosen", async () => {
    const {user, button} = setup();
    await user.click(button);
    const link = within(screen.getByRole("navigation", {name: "Navigatie", hidden: true})).getByRole("link", {name: "Sollicitaties", hidden: true});
    link.addEventListener("click", (e) => e.preventDefault());
    await user.click(link);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
