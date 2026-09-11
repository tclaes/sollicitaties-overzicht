import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("marking a vacancy as favorite moves it to the top of the overview", async ({ page }) => {
  await login(page);

  // "Reeds Gesolliciteerd Rol" has no match score and normally sorts below
  // "Nieuwe Frontend Rol" (strong match) under the default match sort.
  await page.goto("/vacatures");
  await expect(page.locator("tbody tr").first()).toContainText("Nieuwe Frontend Rol");

  await page.goto("/vacatures/vacancy-gesolliciteerd");
  await page.getByRole("button", { name: "Markeer als favoriet" }).click();
  await expect(page.getByRole("button", { name: "Verwijder favoriet" })).toBeVisible();

  await page.goto("/vacatures");
  await expect(page.locator("tbody tr").first()).toContainText("Reeds Gesolliciteerd Rol");

  await page.goto("/vacatures/vacancy-gesolliciteerd");
  await page.getByRole("button", { name: "Verwijder favoriet" }).click();

  await page.goto("/vacatures");
  await expect(page.locator("tbody tr").first()).toContainText("Nieuwe Frontend Rol");
});
