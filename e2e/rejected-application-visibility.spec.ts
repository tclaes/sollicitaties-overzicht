import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("rejecting an application archives the vacancy and it stays visible under Niet interessant", async ({ page }) => {
  await login(page);

  await page.goto("/sollicitaties");
  const row = page.locator("tr", { hasText: "Reeds Gesolliciteerd Rol" });
  await row.locator("select").selectOption("not_hired");

  await expect(page).toHaveURL(/\/sollicitaties/);

  await page.goto("/vacatures");
  await expect(page.getByText("Reeds Gesolliciteerd Rol")).not.toBeVisible();

  await page.getByRole("link", { name: "Niet interessant" }).click();
  await expect(page.getByText("Reeds Gesolliciteerd Rol")).toBeVisible();
});
