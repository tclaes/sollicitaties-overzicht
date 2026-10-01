import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("applying to a vacancy moves it to gesolliciteerd and shows up in Sollicitaties", async ({ page }) => {
  await login(page);

  const row = page.locator("tr", { hasText: "Bekeken Full Stack Rol" });
  await row.getByRole("button", { name: "Solliciteer" }).click();
  await row.getByTitle("Bevestigen").click();

  // Na solliciteren toont de rij de bewerkbare status (een <select>); "Gesolliciteerd"
  // is daarin een <option> en dus nooit als zichtbare tekst te vinden.
  await expect(row.getByLabel("Status van de sollicitatie")).toHaveValue("applied");

  await page.getByRole("link", { name: "Sollicitaties" }).and(page.locator('[href="/sollicitaties"]')).click();
  await expect(page.getByRole("heading", { name: "Sollicitaties" })).toBeVisible();
  await expect(page.getByText("Fixture Full Stack NV")).toBeVisible();
});

test("applying from the detail page keeps the user on that page", async ({ page }) => {
  await login(page);

  await page.locator("tr", { hasText: "Detail Solliciteer Rol" }).click();
  await expect(page).toHaveURL(/\/vacatures\/[^/]+$/);
  const detailUrl = page.url();
  // Wacht tot de detailpagina echt gerenderd is; tijdens de navigatie staat de lijst nog even in beeld.
  await expect(page.getByRole("heading", { level: 1, name: "Detail Solliciteer Rol" })).toBeVisible();

  // Playwright klikt ook op onzichtbare knoppen; controleer dus expliciet dat de knop zichtbaar is.
  const applyButton = page.getByRole("button", { name: "Solliciteer" });
  await expect(applyButton).toHaveCSS("opacity", "1");
  await applyButton.click();
  await page.getByTitle("Bevestigen").click();

  await expect(page.getByLabel("Status van de sollicitatie")).toHaveValue("applied");
  await expect(applyButton).toHaveCount(0);
  expect(page.url()).toBe(detailUrl);

  await page.getByLabel("Status van de sollicitatie").selectOption("interviewing");
  await expect(page.getByLabel("Status van de sollicitatie")).toHaveValue("interviewing");
  expect(page.url()).toBe(detailUrl);
});
