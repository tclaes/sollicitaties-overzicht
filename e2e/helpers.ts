import type { Page } from "@playwright/test";
import { TEST_USER } from "./seed";

export async function login(page: Page) {
  await page.goto("/");
  await page.getByLabel("E-mail").fill(TEST_USER.email);
  await page.getByLabel("Wachtwoord").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.getByRole("heading", { name: "Vacatures" }).waitFor();
}
