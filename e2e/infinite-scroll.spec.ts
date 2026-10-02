import { expect, test } from "@playwright/test";
import { login } from "./helpers";
import { BULK_COUNT, BULK_SOURCE } from "./seed";

test("scrolling loads more vacancies until all are shown", async ({ page }) => {
  await login(page);

  await page.goto(`/vacatures?source=${BULK_SOURCE}&sort=title`);
  const rows = page.locator("tbody tr");
  await expect(page.getByText(`${BULK_COUNT} vacatures`, { exact: true })).toBeVisible();
  await expect(rows.first()).toBeVisible();
  const initial = await rows.count();
  expect(initial).toBeLessThan(BULK_COUNT);

  // Blijf naar beneden scrollen: er komen steeds nieuwe chunks bij tot alles geladen is.
  await expect(async () => {
    await page.mouse.wheel(0, 100_000);
    await expect(rows).toHaveCount(BULK_COUNT, { timeout: 1000 });
  }).toPass({ timeout: 15_000 });

  await expect(page.getByText("Alle vacatures geladen")).toBeVisible();
  await expect(page.getByText("Bulk Vacature 60")).toBeVisible();
});

test("archived vacancies stay out of the list until asked for", async ({ page }) => {
  await login(page);

  await page.goto("/vacatures");
  await expect(page.getByText("Nieuwe Frontend Rol")).toBeVisible();
  // De teller kent het archief, de lijst toont het niet.
  await expect(page.getByText("Niet interessant", { exact: true }).locator("..")).toContainText("1");
  await expect(page.getByText("Gearchiveerde Svelte Rol")).not.toBeVisible();

  await page.getByRole("checkbox", { name: "Inclusief gearchiveerd" }).check();
  await expect(page.getByText("Gearchiveerde Svelte Rol")).toBeVisible();
});
