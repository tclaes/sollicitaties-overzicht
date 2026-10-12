import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("marking a vacancy not interesting archives it, then restoring brings it back", async ({ page }) => {
  await login(page);

  await page.goto("/vacatures");
  await page.locator("tr", { hasText: "Nieuwe Frontend Rol" }).click();
  await expect(page.getByRole("heading", { name: "Nieuwe Frontend Rol" })).toBeVisible();

  await page.getByRole("button", { name: "Niet interessant" }).click();
  await page.getByPlaceholder(/backend-gericht/).fill("Niet relevant voor e2e-test.");
  await page.getByRole("button", { name: "Archiveren" }).click();

  // Archiveren stuurt terug naar de pagina waar de gebruiker vandaan kwam
  // (hier het overzicht); dat toont de vacature dan niet meer, tenzij de
  // "Niet interessant"-filter aanstaat.
  await expect(page).toHaveURL(/\/vacatures(\?|$)/);
  await expect(page.getByText("Nieuwe Frontend Rol")).not.toBeVisible();

  await page.getByRole("link", { name: "Niet interessant" }).click();
  await expect(page.getByText("Nieuwe Frontend Rol")).toBeVisible();

  await page.goto("/vacatures/vacancy-nieuw");
  await expect(page.getByText("Gearchiveerd — niet interessant")).toBeVisible();
  await expect(page.getByText("Niet relevant voor e2e-test.")).toBeVisible();

  await page.getByRole("button", { name: "Terugzetten" }).click();
  await expect(page.getByRole("button", { name: "Niet interessant" })).toBeVisible();

  await page.goto("/vacatures");
  await expect(page.getByText("Nieuwe Frontend Rol")).toBeVisible();
});

test("clicking a counter in the stats bar filters by that status", async ({ page }) => {
  await login(page);

  // Parallelle specs wijzigen de fixtures, dus we leunen niet op een specifieke
  // zichtbare vacature: de "nieuw"-fixture kan nooit onder status=applied staan.
  await page.goto("/vacatures");
  await expect(page.getByRole("link", { name: /Totaal/ })).toHaveAttribute("aria-current", "true");

  const applied = page.getByRole("link", { name: /Gesolliciteerd/ });
  await applied.click();
  await expect(page).toHaveURL(/status=applied/);
  await expect(applied).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("Nieuwe Frontend Rol")).not.toBeVisible();

  await page.getByRole("link", { name: /Totaal/ }).click();
  await expect(page).not.toHaveURL(/status=/);
  await expect(page.getByRole("link", { name: /Totaal/ })).toHaveAttribute("aria-current", "true");
});
