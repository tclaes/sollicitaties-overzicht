import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotInteresting } from "./NotInteresting";

const navigate = vi.fn();
const invalidate = vi.fn().mockResolvedValue(undefined);

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ invalidate }),
}));

vi.mock("~/lib/vacancies", () => ({
  markNotInteresting: vi.fn().mockResolvedValue(undefined),
  restoreVacancy: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  navigate.mockClear();
  invalidate.mockClear();
});

describe("NotInteresting", () => {
  it("redirects to the vacancy overview after archiving", async () => {
    const user = userEvent.setup();

    render(<NotInteresting id="v1" isArchived={false} />);

    await user.click(screen.getByRole("button", { name: "Niet interessant" }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));

    expect(navigate).toHaveBeenCalledWith({ to: "/vacatures" });
  });

  it("does not redirect when the vacancy is only restored", async () => {
    const user = userEvent.setup();

    render(<NotInteresting id="v1" isArchived={true} reason="Te ver weg" />);

    await user.click(screen.getByRole("button", { name: "Terugzetten" }));

    expect(navigate).not.toHaveBeenCalled();
  });
});
