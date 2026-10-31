import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("all status filters are reachable in the scrollable strip", async ({ page }) => {
  await login(page);

  const strip = page.getByRole("navigation", { name: "Status" });
  for (const name of [/Totaal/, /Nieuw/, /Bekeken/, /Gesolliciteerd/, /Niet interessant/, /Niet aangeworven/]) {
    const link = strip.getByRole("link", { name });
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeInViewport();
  }

  await strip.getByRole("link", { name: /Niet aangeworven/ }).click();
  await expect(page).toHaveURL(/status=not-hired/);
  await expect(strip.getByRole("link", { name: /Niet aangeworven/ })).toHaveAttribute("aria-current", "true");
  await expect(strip.getByRole("link", { name: /Niet aangeworven/ })).toBeInViewport();
});

test("searching keeps the selected filter on a small screen", async ({ page }) => {
  await login(page);
  await page.goto("/vacatures?source=indeed");

  const searchbox = page.getByRole("searchbox", { name: "Zoek vacatures" });
  await searchbox.fill("react");
  await expect(page).toHaveURL(/q=react/);
  await expect(page).toHaveURL(/source=indeed/);
  await expect(page.getByText("Bekeken Full Stack Rol")).toBeVisible();
  await expect(page.getByText("Nieuwe Frontend Rol")).not.toBeVisible();

  const box = await searchbox.boundingBox();
  const viewport = page.viewportSize();
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
});
