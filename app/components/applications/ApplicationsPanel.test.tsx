import {describe, expect, it, vi} from "vite-plus/test";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ApplicationsPanel} from "./ApplicationsPanel";
import type {Application} from "~/lib/schemas";

vi.mock("~/lib/vacancies", () => ({
  updateApplication: vi.fn().mockResolvedValue(undefined),
  archiveVacancy: vi.fn().mockResolvedValue(undefined),
}));

const application: Application = {
  id: "a1",
  vacancyId: "v1",
  company: "Acme BV",
  role: "Frontend Developer",
  appliedOn: "2026-01-15",
  status: "applied",
};

describe("ApplicationsPanel", () => {
  it("shows company, role and a status select per application", () => {
    render(<ApplicationsPanel applications={[application]}/>);
    expect(screen.getByText("Acme BV")).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveDisplayValue("gesolliciteerd");
  });

  it("saves a changed status", async () => {
    const {updateApplication} = await import("~/lib/vacancies");
    const user = userEvent.setup();
    render(<ApplicationsPanel applications={[application]}/>);

    await user.selectOptions(screen.getByRole("combobox"), "in gesprek");

    expect(updateApplication).toHaveBeenCalledWith("a1", "interviewing");
    expect(screen.getByRole("combobox")).toHaveDisplayValue("in gesprek");
  });
});
