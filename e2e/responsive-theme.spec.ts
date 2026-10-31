import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("the theme selector lives in the drawer and keeps it open", async ({ page }) => {
  await login(page);
  const nav = page.getByRole("navigation", { name: "Navigatie" });
  await page.getByRole("button", { name: "Menu" }).click();

  const dark = nav.getByRole("radio", { name: "Donker" });
  await expect(dark).toBeVisible();
  const box = await dark.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  await dark.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(nav).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "true");
});

test("the header has no theme control", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("banner").getByRole("radiogroup")).toHaveCount(0);
});

for (const width of [320, 375]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("dark theme and open drawer have no horizontal overflow", async ({ page }) => {
      await login(page);
      await page.getByRole("button", { name: "Menu" }).click();
      await page.getByRole("navigation", { name: "Navigatie" }).getByRole("radio", { name: "Donker" }).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
