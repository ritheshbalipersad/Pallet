import { test, expect } from '@playwright/test';

test('login page loads and shows form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
});

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Username').fill('wrong');
  await page.getByPlaceholder('Password').fill('wrong');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page.getByText(/Invalid|Unauthorized|error/i)).toBeVisible({ timeout: 5000 });
});

test('login with valid credentials redirects to home', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\//);
  await expect(page.getByText(/PalletMS|Quick actions|Scan/i)).toBeVisible({ timeout: 5000 });
});
