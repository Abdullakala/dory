import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';

export default defineConfig({
    testDir: '.',
    testMatch: 'automation-api.spec.ts',
    timeout: 30_000,
    use: { baseURL },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
