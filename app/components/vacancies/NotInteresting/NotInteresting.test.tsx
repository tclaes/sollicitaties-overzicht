import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotInteresting } from "./NotInteresting";
import { markNotInteresting, restoreVacancy } from "~/lib/vacancies";

const navigate = vi.fn();
const invalidate = vi.fn().mockResolvedValue(undefined);
const historyBack = vi.fn();
let canGoBack = true;

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ invalidate, history: { back: historyBack } }),
  useCanGoBack: () => canGoBack,
}));

vi.mock("~/lib/vacancies", () => ({
  markNotInteresting: vi.fn().mockResolvedValue(undefined),
  restoreVacancy: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  navigate.mockClear();
  invalidate.mockClear();
  historyBack.mockClear();
  canGoBack = true;
});

describe("NotInteresting", () => {
  it("navigates back to the previous page after archiving", async () => {
    const user = userEvent.setup();

    render(<NotInteresting id="v1" isArchived={false} />);

    await user.click(screen.getByRole("button", { name: "Niet interessant" }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));

    expect(historyBack).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("falls back to the vacancy overview when there is no history to go back to", async () => {
    canGoBack = false;
    const user = userEvent.setup();

    render(<NotInteresting id="v1" isArchived={false} />);

    await user.click(screen.getByRole("button", { name: "Niet interessant" }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));

    expect(navigate).toHaveBeenCalledWith({ to: "/vacatures" });
    expect(historyBack).not.toHaveBeenCalled();
  });

  it("does not redirect when the vacancy is only restored", async () => {
    const user = userEvent.setup();

    render(<NotInteresting id="v1" isArchived={true} reason="Te ver weg" />);

    await user.click(screen.getByRole("button", { name: "Terugzetten" }));

    expect(navigate).not.toHaveBeenCalled();
    expect(historyBack).not.toHaveBeenCalled();
  });

  it("archives an applied vacancy with its status so it can become not-hired", async () => {
    const user = userEvent.setup();

    render(<NotInteresting id="v1" isArchived={false} status="applied" />);

    await user.click(screen.getByRole("button", { name: "Niet interessant" }));
    await user.click(screen.getByRole("button", { name: "Archiveren" }));

    expect(markNotInteresting).toHaveBeenCalledWith("v1", "Niet interessant voor mij", "applied");
  });

  it("shows a distinct heading and restores to applied for a not-hired vacancy", async () => {
    const user = userEvent.setup();

    render(<NotInteresting id="v1" isArchived={true} reason="Andere kandidaat gekozen" status="not-hired" />);

    expect(screen.getByText("Gearchiveerd — niet aangeworven")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Terugzetten" }));

    expect(restoreVacancy).toHaveBeenCalledWith("v1", true);
  });
});
