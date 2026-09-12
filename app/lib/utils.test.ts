import { describe, it, expect } from "vite-plus/test";
import { capitalizeFirstLetter } from "./utils";

describe("capitalizeFirstLetter", () => {
  it("capitalizes the first letter of a lowercase string", () => {
    expect(capitalizeFirstLetter("hello")[0]).toBe("H");
  });

  it("keeps the rest of the string unchanged", () => {
    expect(capitalizeFirstLetter("hello")).toBe("Hello");
    expect(capitalizeFirstLetter("world")).toBe("World");
  });

  it("works when the first letter is already uppercase", () => {
    expect(capitalizeFirstLetter("Hello")).toBe("Hello");
  });

  it("works on a single character", () => {
    expect(capitalizeFirstLetter("a")).toBe("A");
  });
});
