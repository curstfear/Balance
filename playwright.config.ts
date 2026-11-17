import { defineConfig, devices } from '@playwright/test';

// UI scenarios in WebKit (the engine behind Safari and home-screen apps on iPhone).
// Runs against the production build: `npm run build` first.
const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/Balance/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/Balance/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'iphone-dark', use: { ...devices['iPhone 15'], colorScheme: 'dark' } },
    { name: 'iphone-light', use: { ...devices['iPhone 15'], colorScheme: 'light' }, testMatch: /smoke/ },
  ],
});
