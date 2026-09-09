import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("applying to a vacancy moves it to gesolliciteerd and shows up in Sollicitaties", async ({ page }) => {
  await login(page);

  const row = page.locator("tr", { hasText: "Bekeken Full Stack Rol" });
  await row.getByRole("button", { name: "Solliciteer" }).click();
  await row.getByTitle("Bevestigen").click();

  await expect(row.getByText("Gesolliciteerd", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Sollicitaties" }).and(page.locator('[href="/sollicitaties"]')).click();
  await expect(page.getByRole("heading", { name: "Sollicitaties" })).toBeVisible();
  await expect(page.getByText("Fixture Full Stack NV")).toBeVisible();
});
