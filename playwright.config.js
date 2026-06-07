// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E Test Configuration — HitConfirm
 * 
 * Runs tests in Chromium only (minimal, fast). 
 * Uses a local static file server built into Playwright (no separate server process).
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    // Serve the SPA from its project root
    baseURL: 'http://localhost:5000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },

  // Start a lightweight static file server before tests run
  webServer: {
    command: 'node tests/e2e/server.js',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
