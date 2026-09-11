import { expect, test } from '@playwright/test';

function uniqueEmail(): string {
    return `playwright-register-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
}

test('registration requires the form to be filled out', async ({ page }) => {
    await page.goto('/register');

    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/register');
    await expect(page.getByText('The name field is required.')).toBeVisible();
    await expect(page.getByText('The email field is required.')).toBeVisible();
});

test('registration requires the password confirmation to match', async ({
    page,
}) => {
    await page.goto('/register');

    await page.getByPlaceholder('Name').fill('Playwright Register User');
    await page.getByPlaceholder('Email').fill(uniqueEmail());
    await page.getByPlaceholder('Password', { exact: true }).fill('password');
    await page.getByPlaceholder('Confirm Password').fill('not-matching');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/register');
    await expect(
        page.getByText('The password field confirmation does not match.'),
    ).toBeVisible();
});

test('a visitor can register a new account and is logged in automatically', async ({
    page,
}) => {
    const email = uniqueEmail();

    await page.goto('/register');

    await page.getByPlaceholder('Name').fill('Playwright Register User');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password', { exact: true }).fill('password');
    await page.getByPlaceholder('Confirm Password').fill('password');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
});
