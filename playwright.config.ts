import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: 'list',
    globalSetup: './playwright/global-setup.ts',
    globalTeardown: './playwright/global-teardown.ts',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
