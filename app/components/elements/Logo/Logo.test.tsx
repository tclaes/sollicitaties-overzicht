import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vite-plus/test";
import {Logo} from "./Logo";

describe("Logo", () => {
  it("is announced as Sollie", () => {
    render(<Logo/>);
    expect(screen.getByRole("img", {name: "Sollie"})).toBeInTheDocument();
  });

  it("uses a different viewBox for the stacked variant", () => {
    const {rerender} = render(<Logo/>);
    const horizontal = screen.getByRole("img", {name: "Sollie"}).getAttribute("viewBox");
    rerender(<Logo variant="stacked"/>);
    expect(screen.getByRole("img", {name: "Sollie"}).getAttribute("viewBox")).not.toBe(horizontal);
  });
});
