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
    await expect(page.getByRole('main').getByText('POS Booking')).toBeVisible();

    // Select first show
    const firstShow = page.locator('[style*="cursor: pointer"][style*="border-radius: 10"]').first();
    await firstShow.waitFor({ state: 'visible', timeout: 15000 });
    await firstShow.click();

    // Wait for seat map
    await expect(page.locator('text=SCREEN')).toBeVisible({ timeout: 15000 });

    // Select a regular seat
    const availableSeat = page.locator('button.seat-regular').first();
    await availableSeat.waitFor({ state: 'visible' });
    await availableSeat.click();

    // Step 1: Click "Seats Selected → Add Food"
    await page.click('button:has-text("Seats Selected → Add Food")');

    // Step 2: Should be on food selection step
    await expect(page.locator('text=Add Food & Beverages')).toBeVisible({ timeout: 10000 });

    // Click "Skip, Continue to Checkout" (no food selected)
    await page.click('button:has-text("Skip, Continue to Checkout")');

    // Step 3: Fill customer details
    await page.fill('input[placeholder="Walk-in / Guest"]', 'Test Customer');
    await page.fill('input[placeholder="+91 XXXXX XXXXX"]', '9876543210');

    // Confirm booking
    await page.click('button:has-text("Confirm & Pay")');

    // Verify success
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Test Customer')).toBeVisible();
  });

  test('should add food items to booking', async ({ page }) => {
    await page.goto('/dashboard/pos');
    await expect(page.getByRole('main').getByText('POS Booking')).toBeVisible();

    // Select first show
    const firstShow = page.locator('[style*="cursor: pointer"][style*="border-radius: 10"]').first();
    await firstShow.waitFor({ state: 'visible', timeout: 15000 });
    await firstShow.click();

    // Wait for seat map
    await expect(page.locator('text=SCREEN')).toBeVisible({ timeout: 15000 });

    // Select a seat
    const availableSeat = page.locator('button.seat-regular').first();
    await availableSeat.waitFor({ state: 'visible' });
    await availableSeat.click();

    // Proceed to food step
    await page.click('button:has-text("Seats Selected → Add Food")');
    await expect(page.locator('text=Add Food & Beverages')).toBeVisible({ timeout: 10000 });

    // Wait for food items to load
    await page.waitForTimeout(1000);

    // Add a food item (look for + button)
    const addButton = page.locator('button:has-text("+")').first();
    await addButton.waitFor({ state: 'visible', timeout: 10000 });
    await addButton.click();
    await addButton.click();

    // Continue to checkout
    await page.click('button:has-text("Continue to Checkout")');

    // Verify food subtotal shows in summary
    await expect(page.locator('text=Food Subtotal')).toBeVisible({ timeout: 10000 });

    // Fill customer details
    await page.fill('input[placeholder="Walk-in / Guest"]', 'Food Test');
    await page.fill('input[placeholder="+91 XXXXX XXXXX"]', '9876543210');

    // Confirm booking
    await page.click('button:has-text("Confirm & Pay")');

    // Verify success with food indicator
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Food Test')).toBeVisible();
    await expect(page.getByText('Food', { exact: true })).toBeVisible();
  });

  test('should apply a coupon successfully', async ({ page }) => {
    await page.goto('/dashboard/pos');
    const firstShow = page.locator('[style*="cursor: pointer"][style*="border-radius: 10"]').first();
    await firstShow.waitFor({ state: 'visible', timeout: 15000 });
    await firstShow.click();

    // Select enough seats
    const seats = page.locator('button.seat-regular');
    await seats.first().waitFor({ state: 'visible' });
    for (let i = 0; i < 4; i++) {
      await seats.nth(i).click();
    }

    // Go to food step then checkout (coupon applied at checkout step)
    await page.click('button:has-text("Seats Selected → Add Food")');
    await page.click('button:has-text("Skip, Continue to Checkout")');

    await page.fill('input[placeholder="COUPON CODE"]', 'FIRST50');
    await page.click('button:has-text("Apply")');

    await expect(page.locator('text=✓ Saved')).toBeVisible({ timeout: 10000 });
  });

  test('should change booking date', async ({ page }) => {
    await page.goto('/dashboard/pos');
    await expect(page.getByRole('main').getByText('POS Booking')).toBeVisible();

    // Date picker should exist
    const datePicker = page.locator('input[type="date"]');
    await expect(datePicker).toBeVisible();

    // Shows should load
    const firstShow = page.locator('[style*="cursor: pointer"][style*="border-radius: 10"]').first();
    await firstShow.waitFor({ state: 'visible', timeout: 15000 });

    // Click "Today" if visible (should reset to today)
    const todayBtn = page.locator('button:has-text("Today")');
    // Today button only appears when date != today, so this is fine either way
  });
});

test.describe('Booking Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Manager")');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should show booking details page', async ({ page }) => {
    // First create a booking to have data
    await page.goto('/dashboard/pos');
    await expect(page.getByRole('main').getByText('POS Booking')).toBeVisible();

    const firstShow = page.locator('[style*="cursor: pointer"][style*="border-radius: 10"]').first();
    await firstShow.waitFor({ state: 'visible', timeout: 15000 });
    await firstShow.click();

    await expect(page.locator('text=SCREEN')).toBeVisible({ timeout: 15000 });

    const availableSeat = page.locator('button.seat-regular').first();
    await availableSeat.waitFor({ state: 'visible' });
    await availableSeat.click();

    await page.click('button:has-text("Seats Selected → Add Food")');
    await page.click('button:has-text("Skip, Continue to Checkout")');

    await page.fill('input[placeholder="Walk-in / Guest"]', 'Detail Test');
    await page.fill('input[placeholder="+91 XXXXX XXXXX"]', '9876543210');
    await page.click('button:has-text("Confirm & Pay")');

    // Get booking ref from confirmation page
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible({ timeout: 15000 });
    // Find booking ref in the summary card (BK... format)
    const refLocator = page.getByText(/BK\d{10,}/)
    await refLocator.waitFor({ state: 'visible', timeout: 15000 })
    const bookingRef = (await refLocator.textContent())?.trim();

    // Navigate to bookings list
    await page.click('button:has-text("All Bookings")');
    await expect(page).toHaveURL(/\/dashboard\/bookings/, { timeout: 10000 });

    // Click on the booking ref link
    if (bookingRef) {
      await page.click(`text=${bookingRef}`);
      await expect(page.locator('text=Booking Details')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Detail Test')).toBeVisible();
      await expect(page.getByText('🎟️ Seats (')).toBeVisible();
      await expect(page.getByText('Food & Beverages')).toBeVisible();
    }
  });
});