import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://localhost:5174",
    browserName: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npx tsx tests/e2e-server.ts",
      cwd: "../server",
      url: "http://localhost:5001/api/v1/health",
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: "npm run dev -- --port 5174",
      url: "http://localhost:5174",
      env: { VITE_API_URL: "http://localhost:5001/api/v1" },
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});