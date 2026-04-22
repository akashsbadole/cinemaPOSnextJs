# 🎬 CinePOS — Movie Booking & Theater Management System

![cinemapos-dashboard](cinemapos-dashboard.png) 

A production-grade, full-stack Movie/Event Booking POS SaaS built with:

- **Frontend**: Next.js 14 (App Router) + React 18
- **State**: Zustand (client-side)
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **Auth**: JWT-based sessions with RBAC (4 roles)
- **Realtime**: Seat status polling + DB-level locking
- **Desktop**: Tauri v1 (cross-platform native app)
- **Styling**: Tailwind CSS + custom CSS variables

---

## ✅ Features

### 🎟️ Booking Engine
- Real-time seat selection with 5-minute lock timer
- Race condition-safe seat locking (DB-level atomic upserts)
- Booking statuses: PENDING → CONFIRMED → CANCELLED / REFUNDED
- Coupon validation (PERCENT / FLAT discounts)
- Walk-in POS booking flow

### 🎬 Movie & Show Management
- Full CRUD for movies (title, format, language, duration, rating)
- Show scheduling with conflict detection
- Dynamic pricing: VIP / Premium / Regular per show
- Show statuses: SCHEDULED → LIVE → COMPLETED

### 💳 POS Terminal
- Responsive seat map with real-time availability
- Payment methods: Cash, UPI, Card, Wallet
- Coupon application
- One-click ticket print (HTML with QR code)

### 📊 Analytics & Reports
- Dashboard: live KPIs, revenue charts (Recharts), occupancy
- Revenue report: daily breakdown, channel split
- Occupancy report: per-show statistics
- Movie performance report
- Cancellation & refund report

### 👥 Staff & RBAC
- 4 roles: SUPER_ADMIN, THEATER_OWNER, MANAGER, CLERK
- Role-based API guards
- Staff CRUD with password management

### 🔐 Security
- JWT sessions (HttpOnly cookies)
- Zod input validation on all API routes
- Permission checks on every mutation
- Seat lock prevents double-booking

### 🖥️ Desktop (Tauri)
- Native system tray (show/quit)
- Window controls (minimize/maximize/close)
- Separate ticket print window
- Min window size enforcement
- Auto-starts Next.js server in production build

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env — the defaults work for local dev
```

### 3. Initialize database
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Create SQLite database
npm run db:seed       # Seed with demo data
```

### 4. Start development server
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Login credentials (demo)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@cinepos.com | admin123 |
| Manager | manager@cinepos.com | clerk123 |
| Clerk | clerk@cinepos.com | clerk123 |

---

## 🖥️ Desktop App (Tauri)

### Prerequisites
- Rust + Cargo: https://rustup.rs
- Tauri CLI: `npm install -g @tauri-apps/cli`
- Platform deps:
  - **Linux**: `sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools

### Run Desktop in Dev Mode
```bash
npm run tauri:dev
```

### Build Desktop App
```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/
```

---

## 📁 Project Structure

```
cinepos/
├── app/
│   ├── api/                    # API Routes (Next.js Route Handlers)
│   │   ├── auth/               # Login, logout, session
│   │   ├── movies/             # Movie CRUD
│   │   ├── shows/              # Show management + seat status
│   │   ├── bookings/           # Booking engine + ticket
│   │   ├── seats/              # Seat lock/unlock/poll
│   │   ├── coupons/            # Coupon validation + CRUD
│   │   ├── reports/            # Analytics & reports
│   │   ├── staff/              # User management
│   │   └── theaters/           # Theater + screen management
│   ├── dashboard/              # Protected app pages
│   │   ├── page.tsx            # Dashboard home
│   │   ├── pos/                # POS booking terminal
│   │   ├── movies/             # Movie management
│   │   ├── shows/              # Show scheduling
│   │   ├── bookings/           # Booking list & detail
│   │   ├── analytics/          # Charts & KPIs
│   │   ├── reports/            # Export reports
│   │   ├── coupons/            # Coupon management
│   │   ├── staff/              # Staff management
│   │   ├── theaters/           # Theater config
│   │   └── settings/           # System settings
│   ├── login/                  # Auth page
│   └── globals.css             # Design tokens + utility classes
├── lib/
│   ├── auth.ts                 # JWT auth + RBAC
│   ├── db.ts                   # Prisma singleton
│   ├── seat-lock.ts            # Race-safe seat locking
│   ├── store.ts                # Zustand state
│   └── ticket.ts               # HTML ticket + QR generation
├── prisma/
│   ├── schema.prisma           # Full DB schema (15 tables)
│   └── seed.js                 # Demo data seeder
└── src-tauri/                  # Tauri desktop app
    ├── src/main.rs             # Rust backend (tray, commands)
    ├── Cargo.toml
    └── tauri.conf.json
```

---

## 🗄️ Database Schema

15 tables: `users`, `sessions`, `theaters`, `screens`, `seats`, `movies`, `shows`, `seat_locks`, `bookings`, `booking_seats`, `payments`, `cancellations`, `coupons`, `notifications`

### Switch to PostgreSQL (production)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cinepos"
```
Then run: `npm run db:migrate`

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite or PostgreSQL URL | `file:./dev.db` |
| `NEXTAUTH_SECRET` | JWT signing secret (min 32 chars) | required |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |
| `FAST2SMS_API_KEY` | SMS notifications (optional) | — |
| `RESEND_API_KEY` | Email notifications (optional) | — |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API (optional) | — |

---

## 📱 Responsive Design

- Full mobile support (hamburger sidebar, stacked layouts)
- Tablet-optimized column hiding
- Desktop optimized seat map
- Print-ready ticket layout

---

## 🏗️ Architecture Decisions

| Concern | Solution |
|---------|---------|
| Seat double-booking | DB-level upsert with unique constraint on (showId, seatId) |
| Race conditions | Atomic `upsert` in `seat_locks` table, TTL via `expiresAt` |
| Auth | HttpOnly JWT cookie, 8h expiry, role in payload |
| State management | Zustand (client) + server state from API |
| Realtime | Polling every 10s (upgradeable to WebSockets/SSE) |

---

Built with ❤️ — CinePOS v1.0.0
