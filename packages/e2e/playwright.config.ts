import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration
 * Story 5.8: E2E Tests
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // Run tests in parallel within a file
  fullyParallel: true,
  // Fail the build on CI if test.only is left in code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ...(process.env.CI ? [['github' as const]] : []),
  ],
  // Shared settings for all projects
  use: {
    // Base URL for navigation actions
    baseURL: 'http://localhost:5173',
    // Collect trace on first retry
    trace: 'on-first-retry',
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    // Video recording
    video: 'retain-on-failure',
    // Default navigation timeout
    navigationTimeout: 30000,
    // Default action timeout
    actionTimeout: 15000,
  },
  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Uncomment for WebKit testing
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Mobile testing
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
  // Web server configuration
  webServer: {
    command: 'pnpm --filter @social-content/ui dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  // Global test timeout
  timeout: 60000,
  // Expect timeout
  expect: {
    timeout: 10000,
  },
});
