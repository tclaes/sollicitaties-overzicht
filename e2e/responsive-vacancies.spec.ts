import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("the vacancy list shows cards instead of a table on a small screen", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("vacancy-card").first()).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("applying from a card shows the application status without leaving the list", async ({ page }, testInfo) => {
  await login(page);

  // Eigen fixture per project: mobile en tablet draaien parallel op dezelfde data.
  const device = testInfo.project.name === "tablet" ? "Tablet" : "Mobile";
  const card = page.getByTestId("vacancy-card").filter({ hasText: `Solliciteer Kaart ${device}` });
  const applyButton = card.getByRole("button", { name: "Solliciteer" });
  await expect(applyButton).toHaveCSS("opacity", "1");
  await applyButton.click();
  await card.getByTitle("Bevestigen").click();

  await expect(card.getByLabel("Status van de sollicitatie")).toHaveValue("applied");
  await expect(page).toHaveURL(/\/vacatures(\?.*)?$/);
});

test("tapping a card opens the detail page", async ({ page }) => {
  await login(page);
  await page.getByTestId("vacancy-card").filter({ hasText: "Detail Solliciteer Rol" }).click();
  await expect(page).toHaveURL(/\/vacatures\/[^/]+$/);
});
