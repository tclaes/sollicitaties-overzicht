import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vite-plus/test";
import {Logo} from "./Logo";

describe("Logo", () => {
  it("is announced as Sollie", () => {
    render(<Logo/>);
    expect(screen.getByRole("img", {name: "Sollie"})).toBeInTheDocument();
  });

  it("lays out symbol and wordmark per variant", () => {
    const transforms = () =>
      Array.from(screen.getByRole("img", {name: "Sollie"}).querySelectorAll("g")).map((g) => g.getAttribute("transform"));
    const {rerender} = render(<Logo/>);
    expect(transforms()).toEqual([
      "translate(0 40) scale(0.8163) translate(-30 -30) translate(-6 6)",
      "translate(216 0)",
    ]);
    rerender(<Logo variant="stacked"/>);
    expect(transforms()).toEqual(["translate(136 0) translate(-30 -30) translate(-6 6)", "translate(0 200)"]);
  });

  it("uses a different viewBox for the stacked variant", () => {
    const {rerender} = render(<Logo/>);
    const horizontal = screen.getByRole("img", {name: "Sollie"}).getAttribute("viewBox");
    rerender(<Logo variant="stacked"/>);
    expect(screen.getByRole("img", {name: "Sollie"}).getAttribute("viewBox")).not.toBe(horizontal);
  });
});
