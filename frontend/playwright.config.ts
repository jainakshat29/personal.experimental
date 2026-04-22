import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'cd ../backend && uvicorn app.main:app --port 8000',
      port: 8000,
      reuseExistingServer: !process.env['CI'],
      env: { DATABASE_URL: 'sqlite+aiosqlite:///./test.db', SECRET_KEY: 'test-secret-key' },
    },
    {
      command: 'ng serve --port 4200',
      port: 4200,
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
