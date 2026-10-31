import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("the navigation drawer opens, navigates and closes on a small screen", async ({ page }) => {
  await login(page);

  const menu = page.getByRole("button", { name: "Menu" });
  const nav = page.getByRole("navigation", { name: "Navigatie" });

  await expect(nav).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(nav).toBeVisible();

  await nav.getByRole("link", { name: "Sollicitaties" }).click();
  await expect(page.getByRole("heading", { name: "Sollicitaties" })).toBeVisible();
  await expect(nav).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});

test("Escape closes the drawer", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Navigatie" })).toBeHidden();
});
