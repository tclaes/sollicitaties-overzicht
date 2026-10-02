import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("searching on tags stays within the selected filters and can include archived vacancies", async ({ page }) => {
  await login(page);

  // Filter op bron "indeed": zoeken op "React" toont dan enkel de indeed-vacature.
  await page.goto("/vacatures?source=indeed");
  const searchbox = page.getByRole("searchbox", { name: "Zoek vacatures" });
  await searchbox.fill("react");
  await searchbox.press("Enter");

  await expect(page).toHaveURL(/source=indeed/);
  await expect(page).toHaveURL(/q=react/);
  await expect(page.getByText("Bekeken Full Stack Rol")).toBeVisible();
  await expect(page.getByText("Nieuwe Frontend Rol")).not.toBeVisible();

  // Gearchiveerde vacatures zijn standaard verborgen in de zoekresultaten.
  await page.goto("/vacatures");
  await searchbox.fill("svelte");
  await searchbox.press("Enter");
  await expect(page).toHaveURL(/q=svelte/);
  await expect(page.getByText("Gearchiveerde Svelte Rol")).not.toBeVisible();

  await page.getByRole("checkbox", { name: "Inclusief gearchiveerd" }).check();
  await expect(page).toHaveURL(/archived=true/);
  await expect(page.getByText("Gearchiveerde Svelte Rol")).toBeVisible();
});
