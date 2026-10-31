import { expect, test } from "@playwright/test";
import { login } from "./helpers";
import { TEST_USER } from "./seed";

test("logging in works on a small screen", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("E-mail").fill(TEST_USER.email);
  await page.getByLabel("Wachtwoord").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await expect(page.getByRole("heading", { name: "Vacatures" })).toBeVisible();
});

test("interactive elements have a touch target of at least 44px", async ({ page }) => {
  await login(page);

  const targets = [
    page.getByRole("button", { name: "Menu" }),
    page.getByRole("button", { name: "Markeer als favoriet" }).first(),
    page.getByRole("link", { name: "Alle" }).first(),
  ];
  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box, "element heeft een boundingBox").not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(43.5);
    expect(box!.width).toBeGreaterThanOrEqual(43.5);
  }

  // De checkbox zelf is kleiner; zijn label vormt het raakvlak.
  const label = page.locator("label", { hasText: "Inclusief gearchiveerd" });
  expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
});

test("the vacancy detail page fits and keeps its actions reachable", async ({ page }) => {
  await login(page);
  await page.getByTestId("vacancy-card").filter({ hasText: "Responsive Detail Rol" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Responsive Detail Rol" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Solliciteer" })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
