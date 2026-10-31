import { defineConfig, devices } from "@playwright/test";

const RESPONSIVE_SPECS = "**/responsive*.spec.ts";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: RESPONSIVE_SPECS,
    },
    // Responsive-specs draaien op kleine viewports; de overige specs blijven op desktop.
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: RESPONSIVE_SPECS,
    },
    {
      name: "tablet",
      use: {
        ...devices["Pixel 7"],
        viewport: { width: 768, height: 1024 },
      },
      testMatch: RESPONSIVE_SPECS,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_USE_FIREBASE_EMULATOR: "true",
      VITE_FIREBASE_API_KEY: "demo-test-api-key",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-test.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "demo-test",
      VITE_FIREBASE_STORAGE_BUCKET: "demo-test.appspot.com",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "0",
      VITE_FIREBASE_APP_ID: "0:0:web:0",
    },
  },
});
