import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'pages.smoke.ts',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173/grand-theft-survivors/',
    launchOptions: { args: ['--no-sandbox'] },
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --base=/grand-theft-survivors/',
    url: 'http://127.0.0.1:4173/grand-theft-survivors/',
  },
  reporter: 'list',
});
