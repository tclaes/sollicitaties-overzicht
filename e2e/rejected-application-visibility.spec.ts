import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("rejecting an application archives the vacancy and it stays visible under Niet interessant", async ({ page }) => {
  await login(page);

  await page.goto("/sollicitaties");
  const row = page.locator("tr", { hasText: "Reeds Gesolliciteerd Rol" });
  await row.locator("select").selectOption("not_hired");
  await expect(row.locator("select")).toHaveValue("not_hired");
  await expect(page).toHaveURL(/\/sollicitaties/);

  // Zonder redirect als synchronisatiepunt is er geen UI-signaal meer dat de
  // (fire-and-forget) Firestore-writes voor status + archivering echt klaar
  // zijn: page.goto is een harde navigatie en annuleert die requests nog als
  // ze onderweg zijn. networkidle werkt hier niet (de Firestore listen-stream
  // blijft altijd open), dus een korte, ruime vaste wachttijd op de lokale
  // emulator volstaat.
  await page.waitForTimeout(1500);

  await page.goto("/vacatures?status=not-interesting");
  await expect(page.getByText("Reeds Gesolliciteerd Rol")).toBeVisible();

  await page.goto("/vacatures");
  await expect(page.getByText("Reeds Gesolliciteerd Rol")).not.toBeVisible();
});
