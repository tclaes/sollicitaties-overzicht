import {describe, expect, it, vi} from "vite-plus/test";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ThemeSelect} from "./ThemeSelect";

function setup(value: "auto" | "light" | "dark" = "auto") {
  const onChange = vi.fn();
  render(<ThemeSelect value={value} onChange={onChange}/>);
  return {onChange, user: userEvent.setup()};
}

describe("ThemeSelect", () => {
  it("is a named radiogroup with three options", () => {
    setup();
    const group = screen.getByRole("radiogroup", {name: "Weergave"});
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Auto", "Licht", "Donker"]);
  });

  it("marks only the current value as checked", () => {
    setup("dark");
    expect(screen.getByRole("radio", {name: "Donker"})).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", {name: "Auto"})).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", {name: "Licht"})).toHaveAttribute("aria-checked", "false");
  });

  it("only the checked option is in the tab order (roving tabindex)", () => {
    setup("light");
    expect(screen.getByRole("radio", {name: "Licht"})).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", {name: "Auto"})).toHaveAttribute("tabindex", "-1");
  });

  it("reports the clicked option", async () => {
    const {user, onChange} = setup();
    await user.click(screen.getByRole("radio", {name: "Donker"}));
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("moves the selection with the arrow keys", async () => {
    const {user, onChange} = setup("auto");
    screen.getByRole("radio", {name: "Auto"}).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("light");
    expect(screen.getByRole("radio", {name: "Licht"})).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("auto");
  });

  it("wraps around at the ends", async () => {
    const {user, onChange} = setup("auto");
    screen.getByRole("radio", {name: "Auto"}).focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("dark");
    expect(screen.getByRole("radio", {name: "Donker"})).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("auto");
  });
});
