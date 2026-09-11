import {describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {VacancyTable} from "./VacancyTable";
import type {Vacancy} from "~/lib/schemas";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("~/lib/date", () => ({
  todayIso: () => "2026-03-05",
}));

function makeVacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "v1",
    title: "Frontend Developer",
    company: "Acme BV",
    location: "Hasselt, België",
    region: "limburg",
    url: "https://example.com",
    description: "Een leuke rol.",
    source: "indeed",
    dateFound: "2026-03-05T10:00:00.000Z",
    status: "viewed",
    tags: [],
    ...overrides,
  };
}

describe("VacancyTable", () => {
  it("shows an empty state when there are no vacancies", () => {
    render(<VacancyTable vacancies={[]}/>);
    expect(screen.getByText("Geen vacatures gevonden.")).toBeInTheDocument();
  });

  it("renders a row per vacancy with title, company and location", () => {
    render(
      <VacancyTable
        vacancies={[
          makeVacancy(),
          makeVacancy({id: "v2", title: "Backend Developer", company: "Other BV", location: "Leuven"}),
        ]}
      />
    );

    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("Acme BV")).toBeInTheDocument();
    expect(screen.getByText("Backend Developer")).toBeInTheDocument();
    expect(screen.getByText("Other BV")).toBeInTheDocument();
    expect(screen.getByText("Hasselt")).toBeInTheDocument();
    expect(screen.getByText("Leuven")).toBeInTheDocument();
  });

  it("does not show an apply button when no onApply handler is given", () => {
    render(<VacancyTable vacancies={[makeVacancy()]}/>);
    expect(screen.queryByRole("button", {name: "Solliciteer"})).not.toBeInTheDocument();
  });

  it("hides the apply button for a vacancy that already has an application", () => {
    const applicationById = new Map([
      ["v1", {
        id: "a1",
        company: "Acme BV",
        role: "Frontend Developer",
        appliedOn: "2026-01-01",
        status: "applied" as const
      }],
    ]);

    render(<VacancyTable vacancies={[makeVacancy()]} applicationById={applicationById} onApply={vi.fn()}/>);

    expect(screen.queryByRole("button", {name: "Solliciteer"})).not.toBeInTheDocument();
    expect(screen.getByText("gesolliciteerd")).toBeInTheDocument();
    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
  });

  it("calls onApply with the vacancy's data and today's date when confirmed", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn().mockResolvedValue(undefined);

    render(<VacancyTable vacancies={[makeVacancy()]} onApply={onApply}/>);

    await user.click(screen.getByRole("button", {name: "Solliciteer"}));
    await user.click(screen.getByTitle("Bevestigen"));

    expect(onApply).toHaveBeenCalledWith({
      vacancyId: "v1",
      company: "Acme BV",
      role: "Frontend Developer",
      appliedOn: "2026-03-05",
    });
  });
});
