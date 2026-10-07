// @ts-nocheck
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4004',
    trace: 'off'
  },
  // Automatically boots or verifies the CAP backend before running tests
  webServer: {
    command: 'npx cds watch',
    url: 'http://127.0.0.1:4004',
    reuseExistingServer: true,
    timeout: 120 * 1000
  },
  projects: [
    {
      name: 'background-headless',
      testMatch: /s2p-lifecycle\.spec\.ts/
    },
    {
      name: 'foreground-demo',
      testMatch: /s2p-ui\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          slowMo: 1200
        }
      }
    }
  ]
});