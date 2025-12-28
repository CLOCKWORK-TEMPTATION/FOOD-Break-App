/**
 * إعدادات Playwright للاختبارات E2E
 * Playwright Configuration for End-to-End Tests
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const { defineConfig, devices } = require('@playwright/test');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './e2e',

  /* Maximum time one test can run for. */
  timeout: 60 * 1000,

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'e2e-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'e2e-results.json' }]
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Maximum time each action such as `click()` can take */
    actionTimeout: 15000,

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  /* Configure projects for different browsers and scenarios */
  projects: [
    {
      name: 'API Tests',
      testMatch: '**/*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // API testing doesn't need a browser context
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
      },
    },

    // Uncomment for cross-browser testing
    /*
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev:backend',
    url: 'http://localhost:3001/api/v1/health',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Global setup and teardown */
  // globalSetup: require.resolve('./e2e/global-setup.js'),
  // globalTeardown: require.resolve('./e2e/global-teardown.js'),

  /* Output folder for test artifacts */
  outputDir: 'test-results/',

  /* Folder for test results */
  reportSlowTests: {
    max: 5,
    threshold: 30 * 1000, // 30 seconds
  },
});
