# ✅ CinePOS — TODO & Task Tracker

> Track development progress, bugs, enhancements, and upcoming features.
> Status: `[ ]` Todo · `[x]` Done · `[~]` In Progress · `[!]` Blocked

---

## 🚀 Phase 1 — Core Foundation
> Status: **COMPLETE ✅**

- [x] Project setup (Next.js 14 App Router + TypeScript)
- [x] Tailwind CSS + custom CSS design system (`globals.css`)
- [x] Prisma ORM schema (15 tables)
- [x] SQLite local database + PostgreSQL production support
- [x] Database seed with realistic demo data (movies, screens, seats, shows)
- [x] JWT-based authentication (`lib/auth.ts`)
- [x] HttpOnly cookie session management (8h expiry)
- [x] Zustand state management (`lib/store.ts`)
- [x] Responsive sidebar layout with role-based nav
- [x] Login page with demo quick-login buttons
- [x] Root redirect (`/` → `/dashboard`)
- [x] Tauri v1 desktop app config (`src-tauri/`)
- [x] System tray (show/quit menu)
- [x] Native window controls (min/max/close commands)

---

## 🎬 Phase 2 — Movies & Shows
> Status: **COMPLETE ✅**

- [x] Movies list page with search
- [x] Add movie modal (title, format, language, genre, rating, duration, release date)
- [x] Edit movie modal
- [x] Soft-delete (deactivate) movies
- [x] Movies API — GET (list + search), POST, PUT, DELETE
- [x] Shows list page with date picker
- [x] Schedule show modal with conflict detection
- [x] Show statuses: SCHEDULED → LIVE → COMPLETED → CANCELLED
- [x] Dynamic pricing per show (VIP / Premium / Regular)
- [x] Shows API — GET (with occupancy), POST (conflict check), PUT, DELETE
- [x] Show detail API with live seat status

---

## 🪑 Phase 3 — Seat Management & Booking
> Status: **COMPLETE ✅**

- [x] Interactive seat map (grouped by row, color-coded by type)
- [x] VIP / Premium / Regular seat types
- [x] Real-time seat availability polling (every 10s)
- [x] DB-level atomic seat locking (`lib/seat-lock.ts`)
- [x] 5-minute lock timer with visual countdown bar
- [x] Race condition prevention (upsert + unique constraint)
- [x] Seat lock API — POST (lock), DELETE (unlock)
- [x] Seat status API — GET (booked + locked map)
- [x] Max 10 seats per booking enforcement
- [x] Seat selection → lock → checkout flow (3 steps)

---

## 💳 Phase 4 — POS Booking Terminal
> Status: **COMPLETE ✅**

- [x] POS page with show selector strip
- [x] Full seat map rendered from DB
- [x] Seat toggle with live locking
- [x] Coupon code application (PERCENT / FLAT)
- [x] Coupon validation API
- [x] Customer details form (name, phone, email)
- [x] Payment method selector (Cash / UPI / Card / Wallet)
- [x] Booking confirmation with full receipt view
- [x] Print ticket button (opens HTML ticket in new window)
- [x] Bookings API — POST (create), GET (list + filter + paginate)
- [x] Booking confirmation page with booking ref
- [x] "New Booking" button in topbar

---

## 🎟️ Phase 5 — Booking Management
> Status: **COMPLETE ✅**

- [x] Bookings list page with pagination (15/page)
- [x] Filter by status, date, search (ref / name / phone)
- [x] Booking status badges (CONFIRMED / PENDING / CANCELLED / REFUNDED)
- [x] Cancel booking modal with reason input
- [x] Refund rules: >60min = 100% · 0–60min = 50% · after show = 0%
- [x] Cancellation API with refund calculation
- [x] One-click ticket print per booking
- [x] Booking detail API (GET by ID or ref)
- [x] Seat tags displayed in bookings table

---

## 🎁 Phase 6 — Coupons
> Status: **COMPLETE ✅**

- [x] Coupons list page
- [x] Add coupon modal (code, type, value, min order, usage limit, validity dates)
- [x] Coupon types: PERCENT (with max cap) and FLAT
- [x] Coupon validation API (checks expiry, usage limit, min amount)
- [x] Usage count tracking on apply
- [x] Toggle coupon active/inactive
- [x] Coupons API — GET, POST

---

## 📊 Phase 7 — Analytics & Reports
> Status: **COMPLETE ✅**

- [x] Analytics page with date range selector (7D / 14D / 30D / 3M)
- [x] KPI cards: Revenue, Bookings, Avg Occupancy, Top Movie Revenue
- [x] Daily revenue area chart (Recharts)
- [x] Daily bookings bar chart (Recharts)
- [x] Revenue by channel pie chart (POS / Online / Phone)
- [x] Top 5 movies by revenue with progress bars
- [x] Show-by-show occupancy breakdown
- [x] Reports page with printable tables
- [x] Reports API: dashboard / revenue / occupancy / movies / cancellations
- [x] Today's show stats on dashboard

---

## 👥 Phase 8 — Staff Management
> Status: **COMPLETE ✅**

- [x] Staff list page with role badges
- [x] Add staff member modal (name, email, password, role, phone)
- [x] Edit staff member (name, role, phone, active status)
- [x] Deactivate staff (soft delete)
- [x] RBAC middleware on all mutations
- [x] 4 roles: SUPER_ADMIN, THEATER_OWNER, MANAGER, CLERK
- [x] Staff API — GET, POST, PUT, DELETE

---

## 🏛️ Phase 9 — Theaters & Screens
> Status: **COMPLETE ✅**

- [x] Theaters list page
- [x] Add theater modal (name, location, address, phone, email)
- [x] Screens per theater with seat count
- [x] Add screen with seat layout builder (row, count, type)
- [x] Theaters API — GET, POST
- [x] Screens API — GET, POST (with auto seat generation)

---

## ⚙️ Phase 10 — Settings
> Status: **COMPLETE ✅**

- [x] Settings page with profile section
- [x] Theater info display
- [x] App version info

---

## 🖥️ Phase 11 — Tauri Desktop App
> Status: **COMPLETE ✅**

- [x] `src-tauri/tauri.conf.json` — window config, allowlist, bundle settings
- [x] `src-tauri/Cargo.toml` — full Tauri 1.6 feature flags
- [x] `src-tauri/src/main.rs` — system tray, JS commands, production server spawn
- [x] Tauri commands: `get_app_version`, `open_ticket_window`, `minimize_window`, `maximize_window`, `close_window`, `show_notification`
- [x] `next.config.js` — static export mode for Tauri builds
- [x] CORS headers configured for `tauri://localhost`

---

## 🔐 Security Checklist
> Status: **COMPLETE ✅**

- [x] JWT authentication (HttpOnly, Secure, SameSite=Lax)
- [x] RBAC on all API mutations (role hierarchy check)
- [x] Zod validation on all POST/PUT API routes
- [x] DB-level seat lock prevents double-booking
- [x] Atomic upsert prevents race conditions
- [x] Soft deletes (no hard data loss)
- [x] Passwords hashed with bcrypt (cost 10)
- [ ] Rate limiting on booking APIs (TODO — use `next-rate-limit` or middleware)
- [ ] CSRF protection for server actions
- [ ] Input sanitization for XSS prevention
- [ ] API key rotation policy

---

## 📱 Responsive Design Checklist
> Status: **COMPLETE ✅**

- [x] Hamburger sidebar on mobile
- [x] Grid layouts use `auto-fit` + `minmax` (fluid columns)
- [x] Tables hide lower-priority columns on mobile (`.hide-mobile`)
- [x] Seat map has horizontal scroll on small screens
- [x] Show selector strip scrolls horizontally
- [x] Modal max-width + padding on small screens
- [x] All buttons have `flex-wrap` friendly containers
- [x] Font sizes scale with viewport context

---

## 📬 Notifications System
> Status: **COMPLETE ✅**

- [x] SMS integration (Fast2SMS / Twilio)
- [x] Email integration (Resend / Nodemailer)
- [x] WhatsApp Cloud API integration
- [x] BullMQ job queue for notification retries
- [x] Booking confirmation → auto-send SMS + email + WhatsApp
- [x] Reminder 2h before show
- [x] Cancellation alert
- [x] Notification log page
- [x] Notification settings (enable/disable per channel)

---

## 🧾 Ticket Enhancements
> Status: **COMPLETE ✅**

- [x] HTML ticket with QR code
- [x] Booking ref, seats, show time, customer info
- [x] PDF ticket generation (using `jspdf`) - compact size, no blank pages
- [x] Thermal printer format (ESC/POS commands)
- [x] Ticket barcode (Code128) in addition to QR
- [ ] Bulk ticket download for group bookings
- [x] Email ticket as attachment

---

## 📈 Advanced Analytics
> Status: **COMPLETE ✅**

- [x] Hourly heatmap (peak booking hours)
- [x] Week-over-week revenue comparison
- [x] Customer retention / repeat bookings
- [x] Seat type preference analysis
- [x] Revenue forecasting (simple trend line)
- [x] Export to CSV / Excel
- [x] Export to PDF report
- [x] Date range custom picker (calendar)

---

## 🎯 Advanced Features (Roadmap)
> Status: **PLANNED [ ]**

- [ ] Multi-tenant SaaS (tenant isolation per theater chain)
- [x] Online customer-facing booking portal
- [x] Food & beverage add-ons at booking
- [ ] AI-based dynamic pricing (demand-based)
- [ ] Face recognition entry scan (via camera API)
- [ ] Loyalty points system (earn on booking, redeem as discount)
- [ ] Season pass / membership plans
- [ ] Group / corporate booking
- [ ] Waitlist for sold-out shows
- [ ] Show ratings & reviews
- [ ] Parking slot booking integration
- [ ] Real-time WebSocket push (Supabase Realtime / Pusher)
- [ ] Offline POS mode with sync-on-reconnect
- [ ] Admin mobile app (React Native / Capacitor)
- [x] Dark/Light theme toggle (partial — currently dark-only)
- [x] Localization / i18n (Hindi, Telugu, Tamil)

---

## 🐛 Known Issues / Bug Log

| # | Description | Severity | Status |
|---|-------------|----------|--------|
| 1 | Coupon usage limit query has an `OR` duplicate key in Prisma query | Low | Open |
| 2 | Tauri build requires `output: 'export'` — server actions won't work in static mode | Medium | Needs workaround |
| 3 | Seat poll interval doesn't reset when changing shows | Low | Open |
| 4 | No optimistic UI on seat select (slight lag on slow connections) | Low | Open |
| 5 | Analytics charts need empty state for date ranges with no data | Low | Open |

---

## 🔧 Tech Debt

- [ ] Extract repeated toast logic into a `useToast` hook
- [ ] Create shared `<Modal>` component to reduce duplication
- [ ] Create shared `<DataTable>` component for all list pages
- [ ] Add React Query / SWR for data fetching (replace raw `fetch`)
- [ ] Add proper error boundaries per page
- [ ] Add loading skeletons (replace spinner-only)
- [ ] Write unit tests for `seat-lock.ts` and `auth.ts`
- [ ] Write integration tests for booking flow
- [ ] Add Storybook for component documentation
- [ ] Move hardcoded color values to single theme constants file

---

## 📦 Deployment Checklist

- [ ] Switch `DATABASE_URL` to PostgreSQL connection string
- [ ] Set strong `NEXTAUTH_SECRET` (min 32 chars, random)
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Run `npx prisma migrate deploy`
- [ ] Set up PM2 or systemd for process management
- [ ] Configure Nginx reverse proxy
- [ ] Enable HTTPS (Let's Encrypt / Cloudflare)
- [ ] Set up daily database backups
- [ ] Configure log rotation
- [ ] Set `NODE_ENV=production` in environment

---

*Last updated: April 2026 · CinePOS v1.0.0*
