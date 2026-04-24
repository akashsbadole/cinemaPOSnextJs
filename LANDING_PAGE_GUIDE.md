# CinePOS Landing Page Content Guide

This guide provides the copy and structure for the CinePOS landing page on **appixen.com**. It is tailored to three key audiences: **Theater Owners**, **Moviegoers**, and **Developers**.

---

## 1. Hero Section
**Tagline:** Modern Cinema Management, Redefined.
**Sub-tagline:** A production-grade, full-stack Movie Booking & POS system designed for speed, reliability, and real-time growth. From independent screens to large chains.
**Primary CTA:** Get Started for Free
**Secondary CTA:** View Technical Docs

---

## 2. Key Features for Every Audience

### 🏛️ For Theater Owners: Boost Revenue & Efficiency
*   **Real-time Analytics Dashboard:** Track live KPIs, daily revenue, and occupancy rates with beautiful interactive charts.
*   **Comprehensive Staff Management:** 4-tier RBAC (Super Admin, Owner, Manager, Clerk) to delegate tasks safely.
*   **Advanced Coupon System:** Create flat or percentage-based discounts with usage limits and expiry dates to drive sales.
*   **Multi-Platform Flexibility:** Access your dashboard via any web browser or use the **Tauri-powered Desktop App** for a native experience.

### 🎟️ For Moviegoers: Seamless Booking Experience
*   **Interactive Seat Map:** Choose your favorite spot with a color-coded, responsive seat layout.
*   **Real-time Availability:** No more double-bookings. See live seat status updates every 10 seconds.
*   **Instant Digital Tickets:** Get your ticket immediately via HTML, PDF, or Thermal print formats with secure QR codes.
*   **Flexible Payments:** Support for Cash, UPI/QR, Cards, and Wallets.

### 💻 For Developers: Built for Scale & Speed
*   **Modern Tech Stack:** Built with Next.js 14 (App Router), Prisma ORM, and Zustand for state management.
*   **Race-Condition Safe:** DB-level atomic seat locking ensures 100% reliability during high-traffic show launches.
*   **Cross-Platform Desktop:** Native system tray, window controls, and local server integration via Tauri (Rust + React).
*   **Fully Type-Safe:** End-to-end TypeScript and Zod validation for robust API interactions.

---

## 3. Feature Sliders / Visual Highlights
*Use these descriptions to guide the screenshots or videos in your slider.*

1.  **The POS Terminal:** Showcases the interactive seat map where clerks can quickly book tickets for walk-in customers.
2.  **Live Analytics:** Highlights the Recharts-powered "Daily Revenue" area chart and "Top Movies" progress bars.
3.  **Show Scheduling:** Demonstrates the conflict-detection system when setting up new movie times.
4.  **The Digital Ticket:** Displays the clean, QR-coded ticket layout ready for scanning at the theater entrance.

---

## 4. Technical Specs (The Developer Corner)
*   **Frontend:** Next.js 14, Tailwind CSS, Radix UI.
*   **Backend:** Next.js Route Handlers, JWT-based Auth.
*   **Database:** SQLite (Local) / PostgreSQL (Production) via Prisma.
*   **Desktop:** Tauri v1 (Cross-platform native bundle).
*   **Validation:** Zod & React Hook Form.

---

## 5. "Contact Us" / Lead Generation
**Headline:** Ready to upgrade your cinema's technology?
**Fields:**
*   Full Name
*   Theater Name / Company
*   Number of Screens
*   Email Address
*   Message
**CTA:** Request a Demo

---

## 6. Social Proof / Footer
*   **Open Source Roots:** Built with modern standards and developer-friendly documentation.
*   **Production Ready:** Handles everything from seat locks to refund calculations (50% or 100% based on show timing).
