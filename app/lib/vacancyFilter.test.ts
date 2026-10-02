import {describe, expect, it} from "vite-plus/test";
import {filterVacancies, matchesQuery} from "./vacancyFilter";
import {Vacancy} from "./schemas";

function vacancy(overrides: Partial<Vacancy>): Vacancy {
  return {
    id: "v",
    title: "Developer",
    company: "Acme",
    location: "Hasselt",
    region: "limburg",
    url: "",
    description: "",
    source: "vdab",
    dateFound: "2026-10-01T00:00:00.000Z",
    status: "new",
    tags: [],
    ...overrides,
  };
}

const react = vacancy({id: "react", title: "Frontend Developer", function: "frontend", tags: ["React", "TypeScript"]});
const java = vacancy({id: "java", title: "Backend Engineer", function: "fullstack", tags: ["Java"], source: "indeed"});
const archivedReact = vacancy({
  id: "archived-react",
  title: "React Developer",
  function: "frontend",
  tags: ["React"],
  isArchived: true,
  status: "not-interesting",
});
const all = [react, java, archivedReact];
const ids = (vs: Vacancy[]) => vs.map((v) => v.id);

describe("matchesQuery", () => {
  it("matches everything for an empty query", () => {
    expect(matchesQuery(react, undefined)).toBe(true);
    expect(matchesQuery(react, "   ")).toBe(true);
  });

  it("matches on tags, case-insensitive", () => {
    expect(matchesQuery(react, "typescript")).toBe(true);
    expect(matchesQuery(java, "typescript")).toBe(false);
  });

  it("matches on function and its label", () => {
    expect(matchesQuery(java, "fullstack")).toBe(true);
    expect(matchesQuery(java, "full stack")).toBe(true);
  });

  it("matches on title", () => {
    expect(matchesQuery(java, "backend")).toBe(true);
  });

  it("requires every term to match", () => {
    expect(matchesQuery(react, "frontend react")).toBe(true);
    expect(matchesQuery(react, "frontend java")).toBe(false);
  });
});

describe("filterVacancies", () => {
  it("hides archived vacancies by default", () => {
    expect(ids(filterVacancies(all, {q: "react"}))).toEqual(["react"]);
  });

  it("includes archived vacancies when archived is set", () => {
    expect(ids(filterVacancies(all, {q: "react", archived: true}))).toEqual(["react", "archived-react"]);
  });

  it("only searches within the selected filters", () => {
    expect(ids(filterVacancies(all, {q: "developer", source: "indeed"}))).toEqual([]);
    expect(ids(filterVacancies(all, {q: "engineer", source: "indeed"}))).toEqual(["java"]);
    expect(ids(filterVacancies(all, {q: "react", function: "fullstack", archived: true}))).toEqual([]);
    expect(ids(filterVacancies(all, {q: "react", status: "new", archived: true}))).toEqual(["react"]);
  });

  it("shows only archived vacancies in the archive views", () => {
    expect(ids(filterVacancies(all, {status: "not-interesting"}))).toEqual(["archived-react"]);
    expect(ids(filterVacancies(all, {status: "not-hired"}))).toEqual([]);
  });
});
