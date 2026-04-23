import os
import time
import re
from playwright.sync_api import sync_playwright, expect

def run_walkthrough():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Record video
        context = browser.new_context(
            record_video_dir="videos/",
            record_video_size={'width': 1280, 'height': 720},
            viewport={'width': 1280, 'height': 720}
        )
        page = context.new_page()

        try:
            # 1. Intro / Login Page
            print("Scene 1: Login Page")
            page.goto("http://localhost:3000/login")
            time.sleep(3)

            # 2. Login as Admin
            print("Scene 2: Login")
            page.click('button:has-text("Admin")')
            page.click('button[type="submit"]')
            expect(page).to_have_url(re.compile(r".*/dashboard"), timeout=15000)
            time.sleep(3)

            # 3. Movies Management
            print("Scene 3: Movies")
            page.click('text=Movies')
            expect(page.locator('text=Movies').first).to_be_visible()
            time.sleep(4)

            # 4. Shows Scheduling
            print("Scene 4: Shows")
            page.click('text=Shows')
            expect(page.locator('text=Shows').first).to_be_visible()
            time.sleep(4)

            # 5. POS Terminal
            print("Scene 5: POS Terminal")
            page.click('text=POS Booking')
            expect(page.locator('text=POS Booking').first).to_be_visible()
            time.sleep(2)

            # Select show
            print("Selecting show...")
            # Wait for shows to be visible
            page.wait_for_selector('div:has-text("AM"), div:has-text("PM")')
            first_show = page.locator('div:has-text("AM"), div:has-text("PM")').filter(has_text=re.compile(r"Today|Tomorrow|[\d:]+")).first
            first_show.click()
            time.sleep(3)

            # 6. Seat Selection
            print("Scene 6: Seat Selection")
            seats = page.locator('button.seat-regular')
            seats.first.wait_for(state="visible")
            for i in range(4):
                seats.nth(i).click()
                time.sleep(1)
            time.sleep(2)

            # 7. Coupon & Checkout
            print("Scene 7: Checkout")
            page.fill('input[placeholder="COUPON CODE"]', 'FIRST50')
            page.click('button:has-text("Apply")')
            time.sleep(2)
            page.click('button:has-text("Proceed to Checkout")')
            time.sleep(2)
            page.fill('input[placeholder="Walk-in / Guest"]', 'CinePOS Demo')
            page.fill('input[placeholder="+91 XXXXX XXXXX"]', '9988776655')
            time.sleep(2)

            # 8. Confirmation & Ticket
            print("Scene 8: Confirmation")
            page.click('button:has-text("Confirm & Pay")')
            expect(page.locator('text=Booking Confirmed!')).to_be_visible(timeout=15000)
            time.sleep(5)

            # 9. Analytics
            print("Scene 9: Analytics")
            page.click('text=Analytics')
            expect(page.locator('text=Analytics').first).to_be_visible()
            time.sleep(5)

            # 10. Staff & Logout
            print("Scene 10: Staff & Outro")
            page.click('text=Staff')
            expect(page.locator('text=Staff').first).to_be_visible()
            time.sleep(4)

            page.click('text=Sign Out')
            expect(page).to_have_url(re.compile(r".*/login"), timeout=15000)
            time.sleep(3)

            print("Walkthrough completed successfully.")

        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run_walkthrough()
