import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  fullyParallel: false,
  workers: 1, // Sequential flow execution for procurement lifecycle
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4004',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on' // Records full video of requester actions
  },
  projects: [
    // 1. BACKGROUND MODE (Runs the fast API lifecycle test inside SAP BAS)
    {
      name: 'background-headless',
      testMatch: /s2p-lifecycle\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        headless: true
      }
    },
    // 2. FOREGROUND DEMO MODE (Runs the slow-motion UI walkthrough on local laptop)
    {
      name: 'foreground-demo',
      testMatch: /s2p-ui\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          slowMo: 1200 // Delays each action by 1.2s for visual presentation
        }
      }
    }
  ]
});