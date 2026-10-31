import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const html = (page: import("@playwright/test").Page) => page.locator("html");
const radio = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("radiogroup", { name: "Weergave" }).getByRole("radio", { name });

test.describe("dark system, no saved preference", () => {
  test.use({ colorScheme: "dark" });

  test("follows the system and marks Auto as chosen", async ({ page }) => {
    await login(page);
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await expect(radio(page, "Auto")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(18, 18, 17)");
  });

  test("the login page is dark too", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });

  test("an explicit Licht wins over the system and survives a reload", async ({ page }) => {
    await login(page);
    await radio(page, "Licht").click();
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(245, 245, 243)");

    await page.reload();
    await page.getByRole("heading", { name: "Vacatures" }).waitFor();
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await expect(radio(page, "Licht")).toHaveAttribute("aria-checked", "true");
  });
});

test.describe("light system", () => {
  test.use({ colorScheme: "light" });

  test("choosing Donker applies and persists", async ({ page }) => {
    await login(page);
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await radio(page, "Donker").click();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => localStorage.getItem("vacature-theme"))).toBe("dark");

    await page.reload();
    await page.getByRole("heading", { name: "Vacatures" }).waitFor();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });

  test("Auto follows a system change without a reload", async ({ page }) => {
    await login(page);
    await expect(html(page)).toHaveAttribute("data-theme", "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(html(page)).toHaveAttribute("data-theme", "light");
  });

  test("a saved dark preference is applied before the app has loaded (no flash)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("vacature-theme", "dark"));

    // Blokkeer de app-bundel: enkel het inline script in index.html kan het thema nog zetten.
    await page.route("**/app/main.tsx*", (route) => route.abort());
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("#root")).toBeEmpty();
    await expect(html(page)).toHaveAttribute("data-theme", "dark");
  });
});
