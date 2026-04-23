import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully as Admin', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Super Admin').first()).toBeVisible();
  });

  test('should login successfully as Manager', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Manager")');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Manager').first()).toBeVisible();
  });

  test('should login successfully as Clerk', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Clerk")');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Clerk').first()).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Admin")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.click('text=Sign Out');
    await expect(page).toHaveURL(/\/login/);
  });
});
