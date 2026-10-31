import {beforeEach, describe, expect, it, vi} from "vite-plus/test";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {VacancyCardList} from "./VacancyCardList";
import {VacancyList} from "./VacancyList";
import type {Vacancy} from "~/lib/schemas";

const navigate = vi.fn();
const invalidate = vi.fn().mockResolvedValue(undefined);

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouter: () => ({invalidate}),
}));

vi.mock("~/lib/date", () => ({todayIso: () => "2026-03-05"}));

vi.mock("~/lib/vacancies", () => ({
  toggleFavorite: vi.fn().mockResolvedValue(undefined),
  updateApplication: vi.fn().mockResolvedValue(undefined),
  archiveVacancy: vi.fn().mockResolvedValue(undefined),
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

describe("VacancyCardList", () => {
  beforeEach(() => {
    navigate.mockClear();
    invalidate.mockClear();
  });

  it("shows an empty state when there are no vacancies", () => {
    render(<VacancyCardList vacancies={[]}/>);
    expect(screen.getByText("Geen vacatures gevonden.")).toBeInTheDocument();
  });

  it("renders title, function badge, company, location, match and at most 3 tags", () => {
    render(
      <VacancyCardList
        vacancies={[
          makeVacancy({
            function: "fullstack",
            match: {score: "strong", explanation: "Past goed"},
            tags: ["react", "node", "ts", "extra"],
          }),
        ]}
      />,
    );

    const card = screen.getByTestId("vacancy-card");
    expect(within(card).getByText("Frontend Developer", {exact: false})).toBeInTheDocument();
    expect(within(card).getByText("full stack")).toBeInTheDocument();
    expect(within(card).getByText("Acme BV")).toBeInTheDocument();
    expect(within(card).getByText("Hasselt")).toBeInTheDocument();
    expect(within(card).getAllByRole("listitem")).toHaveLength(3);
    expect(within(card).queryByText("extra")).not.toBeInTheDocument();
  });

  it("renders without match and function without breaking", () => {
    render(<VacancyCardList vacancies={[makeVacancy()]}/>);
    const card = screen.getByTestId("vacancy-card");
    expect(within(card).queryByTitle("Past goed")).not.toBeInTheDocument();
    expect(within(card).queryByRole("list", {name: "Tags"})).not.toBeInTheDocument();
  });

  it("navigates to the detail page when the card is clicked", async () => {
    const user = userEvent.setup();
    render(<VacancyCardList vacancies={[makeVacancy()]}/>);
    await user.click(screen.getByText("Acme BV"));
    expect(navigate).toHaveBeenCalledWith({to: "/vacatures/v1"});
  });

  it("toggles favorite without navigating", async () => {
    const {toggleFavorite} = await import("~/lib/vacancies");
    const user = userEvent.setup();
    render(<VacancyCardList vacancies={[makeVacancy()]}/>);
    await user.click(screen.getByRole("button", {name: "Markeer als favoriet"}));
    expect(toggleFavorite).toHaveBeenCalledWith("v1", true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("applies from the card and then shows the application status and date", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn().mockResolvedValue(undefined);
    render(<VacancyCardList vacancies={[makeVacancy()]} onApply={onApply}/>);

    await user.click(screen.getByRole("button", {name: "Solliciteer"}));
    await user.click(screen.getByTitle("Bevestigen"));

    expect(onApply).toHaveBeenCalledWith({
      vacancyId: "v1",
      company: "Acme BV",
      role: "Frontend Developer",
      appliedOn: "2026-03-05",
    });
    expect(await screen.findByText("2026-03-05")).toBeInTheDocument();
    expect(screen.queryByRole("button", {name: "Solliciteer"})).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("VacancyList", () => {
  it("renders a table on desktop", () => {
    // De standaard matchMedia-mock in vitest.setup.ts matcht min-width (desktop).
    render(<VacancyList vacancies={[makeVacancy()]}/>);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByTestId("vacancy-card")).not.toBeInTheDocument();
  });

  it("renders cards on small screens", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<VacancyList vacancies={[makeVacancy()]}/>);
    expect(screen.getByTestId("vacancy-card")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
