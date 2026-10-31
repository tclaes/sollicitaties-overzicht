import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

const WIDTHS = [320, 375, 768];

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("login page has no horizontal overflow", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByLabel("E-mail")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("vacancy list has no horizontal overflow", async ({ page }) => {
      await login(page);
      await expect(page.getByTestId("vacancy-card").first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("vacancy detail has no horizontal overflow", async ({ page }) => {
      await login(page);
      await page.getByTestId("vacancy-card").filter({ hasText: "Responsive Detail Rol" }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Responsive Detail Rol" })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("applications page has no horizontal overflow", async ({ page }) => {
      await login(page);
      await page.goto("/sollicitaties");
      await expect(page.getByRole("heading", { name: "Sollicitaties" })).toBeVisible();
      await expect(page.getByText("Reeds Gesolliciteerd Rol").first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  });
}

test("the last card is reachable at the end of the list", async ({ page }) => {
  await login(page);
  const cards = page.getByTestId("vacancy-card");
  for (let i = 0; i < 10; i++) {
    await page.getByTestId("vacancy-card").last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
  }
  await expect(cards.last()).toBeInViewport();
});

