import { expect, test } from '@playwright/test';

const email = 'playwright-login@example.test';
const password = 'password';

test('a visitor cannot log in with an invalid password', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill(email);
    await page
        .getByPlaceholder('Password', { exact: true })
        .fill('wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/login');
    await expect(
        page.getByText('These credentials do not match our records.'),
    ).toBeVisible();
});

test('a user can log in and then log out', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
});
