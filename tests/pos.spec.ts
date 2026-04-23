import { test, expect } from '@playwright/test';

test.describe('POS Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Clerk")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should complete a successful booking', async ({ page }) => {
    await page.goto('/dashboard/pos');
    // More specific locator for the header
    await expect(page.locator('main h1, main div:has-text("POS Booking")').first()).toBeVisible();

    // Shows are in a div with onClick, but let's try a more robust selector
    // They have "h:mm a" format text inside
    const firstShow = page.locator('div:has-text("AM"), div:has-text("PM")').filter({ hasText: /Today|Tomorrow|[\d:]+/ }).first();
    await firstShow.waitFor({ state: 'visible', timeout: 15000 });
    await firstShow.click();

    // Wait for seat map
    await expect(page.locator('text=SCREEN')).toBeVisible({ timeout: 15000 });

    // Select a regular seat
    const availableSeat = page.locator('button.seat-regular').first();
    await availableSeat.waitFor({ state: 'visible' });
    await availableSeat.click();

    // Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');

    // Fill customer details
    await page.fill('input[placeholder="Walk-in / Guest"]', 'Test Customer');
    await page.fill('input[placeholder="+91 XXXXX XXXXX"]', '9876543210');

    // Confirm booking
    await page.click('button:has-text("Confirm & Pay")');

    // Verify success
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Test Customer')).toBeVisible();
  });

  test('should apply a coupon successfully', async ({ page }) => {
    await page.goto('/dashboard/pos');
    const firstShow = page.locator('div:has-text("AM"), div:has-text("PM")').filter({ hasText: /Today|Tomorrow|[\d:]+/ }).first();
    await firstShow.waitFor({ state: 'visible', timeout: 15000 });
    await firstShow.click();

    // Select enough seats to exceed 500 for FIRST50 (Regular is 150-250 usually)
    const seats = page.locator('button.seat-regular');
    await seats.first().waitFor({ state: 'visible' });
    for (let i = 0; i < 4; i++) {
        await seats.nth(i).click();
    }

    await page.fill('input[placeholder="COUPON CODE"]', 'FIRST50');
    await page.click('button:has-text("Apply")');

    await expect(page.locator('text=✓ Saved')).toBeVisible({ timeout: 10000 });
  });
});
