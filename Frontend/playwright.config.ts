import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

/**
 * Capturas del Manual de Usuario.
 * Requiere stack DEV levantado (frontend + backend + seed).
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run screenshots:manual
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/manual-user-screenshots.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "es-AR",
    colorScheme: "light",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  outputDir: path.join(repoRoot, "docs/screenshots/.playwright-output"),
  projects: [
    {
      name: "manual-screenshots",
      use: { browserName: "chromium" },
    },
  ],
});
