import { expect, test } from "@playwright/test";
import { TEST_USER } from "./seed";

test("logs in and lands on the dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sollicitaties" })).toBeVisible();

  await page.getByLabel("E-mail").fill(TEST_USER.email);
  await page.getByLabel("Wachtwoord").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Inloggen" }).click();

  await expect(page.getByRole("heading", { name: "Vacatures" })).toBeVisible();
  await expect(page.getByText("Nieuwe Frontend Rol")).toBeVisible();
});

test("shows an error for wrong credentials", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("E-mail").fill(TEST_USER.email);
  await page.getByLabel("Wachtwoord").fill("verkeerd-wachtwoord");
  await page.getByRole("button", { name: "Inloggen" }).click();

  await expect(page.getByText("Ongeldig e-mailadres of wachtwoord.")).toBeVisible();
});
