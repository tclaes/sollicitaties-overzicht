import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
    it("renders the correct label for each status", () => {
        const cases = [
            { status: "nieuw", label: "Nieuw" },
            { status: "bekeken", label: "Bekeken" },
            { status: "gesolliciteerd", label: "Gesolliciteerd" },
            { status: "afgewezen", label: "Afgewezen" },
            { status: "niet-interessant", label: "Niet interessant" },
        ] as const;

        for (const { status, label } of cases) {
            const { unmount } = render(<Badge status={status} />);
            expect(screen.getByText(label)).toBeInTheDocument();
            unmount();
        }
    });

    it("renders a span element", () => {
        render(<Badge status="nieuw" />);
        const el = screen.getByText("Nieuw");
        expect(el.tagName).toBe("SPAN");
    });
});
