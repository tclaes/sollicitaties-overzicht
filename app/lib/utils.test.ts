import { describe, it, expect } from "vitest";
import { capitalize } from "./utils";

describe("capitalize", () => {
    it("capitalizes the first letter of a lowercase string", () => {
        expect(capitalize("hello")[0]).toBe("H");
    });

    it("keeps the rest of the string unchanged", () => {
        expect(capitalize("hello")).toBe("Hello");
        expect(capitalize("world")).toBe("World");
    });

    it("works when the first letter is already uppercase", () => {
        expect(capitalize("Hello")).toBe("Hello");
    });

    it("works on a single character", () => {
        expect(capitalize("a")).toBe("A");
    });
});
