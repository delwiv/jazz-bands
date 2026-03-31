import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__-e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  outputDir: '__tests__-e2e/test-results',
  snapshotDir: '__tests__-e2e/screenshots',
})
