# 🧠 CinePOS — Skills & Developer Guide

> Architecture decisions, coding conventions, patterns used, and how to extend each module.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   TAURI SHELL                        │
│  (Native window, system tray, OS notifications)      │
│  ┌───────────────────────────────────────────────┐   │
│  │            NEXT.JS APP (localhost:3000)        │   │
│  │                                               │   │
│  │  ┌──────────┐    ┌──────────────────────┐    │   │
│  │  │  React   │    │   Next.js API Routes  │    │   │
│  │  │  Pages   │◄──►│  (Route Handlers)     │    │   │
│  │  │ (Client) │    │  /app/api/**          │    │   │
│  │  └──────────┘    └──────────┬───────────┘    │   │
│  │       │                     │                 │   │
│  │  ┌────▼────┐         ┌──────▼──────┐         │   │
│  │  │ Zustand │         │   Prisma     │         │   │
│  │  │  Store  │         │   ORM        │         │   │
│  │  └─────────┘         └──────┬──────┘         │   │
│  │                             │                 │   │
│  │                      ┌──────▼──────┐         │   │
│  │                      │  SQLite /    │         │   │
│  │                      │  PostgreSQL  │         │   │
│  │                      └─────────────┘         │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Conventions

### File Naming
| Type | Convention | Example |
|------|-----------|---------|
| Page | `page.tsx` | `app/dashboard/movies/page.tsx` |
| API Route | `route.ts` | `app/api/movies/route.ts` |
| Library | camelCase `.ts` | `lib/seat-lock.ts` |
| Types | inline in file | (no separate `types/` folder) |

### Component Style
- All pages are `'use client'` — they handle their own data fetching via `useEffect + fetch`
- No server components used for pages (keeps Tauri static export compatible)
- Inline styles used throughout (no Tailwind utility classes in JSX — only in globals.css)
- CSS custom properties (`var(--accent)`, `var(--card)`) used everywhere for theming

### API Route Pattern
Every route file exports HTTP method handlers:
```ts
export async function GET(req: Request) { ... }
export async function POST(req: Request) { ... }
export async function PUT(req: Request, { params }) { ... }
export async function DELETE(req: Request, { params }) { ... }
```

Standard response shape:
```ts
// Success
return NextResponse.json({ data })
return NextResponse.json({ data }, { status: 201 })

// Error
return NextResponse.json({ error: 'message' }, { status: 400 })
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

---

## 🔐 Authentication & Authorization

### How Auth Works
1. `POST /api/auth/login` → validates credentials → creates JWT → sets `cinepos-token` cookie
2. Every API route that needs auth calls `getSession()` from `lib/auth.ts`
3. `getSession()` reads cookie → verifies JWT → returns `SessionUser | null`

### Adding Auth to a New Route
```ts
import { getSession, hasPermission } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check role — MANAGER and above
  if (!hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ... handler logic
}
```

### Role Hierarchy
```
SUPER_ADMIN (4) > THEATER_OWNER (3) > MANAGER (2) > CLERK (1)
```
`hasPermission(userRole, minRole)` returns `true` if user's level ≥ required level.

---

## 🗄️ Database — Prisma Patterns

### Adding a New Table
1. Add model to `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or `npm run db:migrate` (prod)
3. Run `npm run db:generate` to regenerate client

### Common Query Patterns
```ts
import { db } from '@/lib/db'

// Find with relations
const show = await db.show.findUnique({
  where: { id },
  include: { movie: true, screen: { include: { theater: true } } }
})

// Paginated list
const [items, total] = await Promise.all([
  db.booking.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } }),
  db.booking.count({ where }),
])

// Transaction (atomic operations)
const result = await db.$transaction(async (tx) => {
  const booking = await tx.booking.create({ data: { ... } })
  await tx.payment.create({ data: { bookingId: booking.id, ... } })
  await tx.seatLock.deleteMany({ where: { ... } })
  return booking
})

// Soft delete pattern
await db.movie.update({ where: { id }, data: { active: false } })
```

### Enum Usage
```ts
// Prisma enums are imported as types
import { BookingStatus, PaymentMethod, SeatType } from '@prisma/client'

// Use in queries
db.booking.findMany({ where: { status: 'CONFIRMED' } })
// or
db.booking.findMany({ where: { status: BookingStatus.CONFIRMED } })
```

---

## 🪑 Seat Locking System

### How It Works
```
User clicks seat
      ↓
POST /api/seats/lock
      ↓
lib/seat-lock.ts::lockSeats()
      ↓
1. Delete expired locks (TTL cleanup)
2. Check for active locks by OTHER sessions (conflict)
3. Check for booked seats (conflict)
4. UPSERT lock: seat_locks { showId, seatId, sessionId, expiresAt }
      ↓
Returns { success: true } or { success: false, conflict: [...] }
      ↓
Frontend starts 5-min countdown timer
```

### Session ID
Each browser/POS terminal has a persistent `sessionId` stored in `localStorage`. This lets the server distinguish "user's own lock" from "someone else's lock".

### Extending Lock TTL
Change `LOCK_TTL_MINUTES` in `lib/seat-lock.ts`:
```ts
const LOCK_TTL_MINUTES = 5  // change to 10 for longer locks
```

### Adding Real-Time Updates (WebSocket upgrade)
Replace the polling in `pos/page.tsx` with:
```ts
// Using Supabase Realtime
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

supabase
  .channel('seat_locks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_locks', filter: `showId=eq.${showId}` },
    (payload) => { /* update seat map */ }
  )
  .subscribe()
```

---

## 🎟️ Booking Flow

```
POS Page (client)
│
├── 1. SELECT SHOW (from shows list)
│         ↓
│   GET /api/shows/:id  →  returns show + all seats with status
│
├── 2. SELECT SEATS (click on seat map)
│         ↓
│   POST /api/seats/lock  →  atomically lock seats (5 min TTL)
│   Frontend starts countdown timer
│
├── 3. APPLY COUPON (optional)
│         ↓
│   POST /api/coupons/validate  →  returns discount amount
│
├── 4. ENTER CUSTOMER DETAILS + PAYMENT METHOD
│
└── 5. CONFIRM BOOKING
          ↓
    POST /api/bookings
          ↓
    lib/seat-lock.ts::lockSeats() — re-verify locks (prevent TOCTOU)
    Calculate prices from DB (never trust client prices)
    Apply coupon discount
    db.$transaction:
      ├── booking.create
      ├── bookingSeats.createMany
      ├── payment.create
      └── seatLock.deleteMany (release locks)
          ↓
    Returns confirmed booking
          ↓
    Client shows success + Print Ticket button
```

---

## 📊 Adding a New Report Type

1. Add a new `type` case in `app/api/reports/route.ts`:
```ts
if (type === 'my_report') {
  const data = await db.booking.findMany({ where: { ... } })
  return NextResponse.json({ data })
}
```

2. Fetch it in the frontend:
```ts
fetch(`/api/reports?type=my_report&from=${from}&to=${to}`)
  .then(r => r.json())
  .then(d => setMyData(d.data))
```

3. Render with Recharts:
```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={200}>
  <BarChart data={myData}>
    <XAxis dataKey="label" tick={{ fill: '#6B6B80', fontSize: 10 }}/>
    <YAxis tick={{ fill: '#6B6B80', fontSize: 10 }}/>
    <Tooltip contentStyle={{ background: '#16161F', border: '1px solid #1E1E2E', borderRadius: 8 }}/>
    <Bar dataKey="value" fill="#E8A020" radius={[4,4,0,0]}/>
  </BarChart>
</ResponsiveContainer>
```

---

## 🎬 Adding a New Page

1. Create `app/dashboard/my-page/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function MyPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/my-endpoint')
      .then(r => r.json())
      .then(d => { setData(d.items); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }}/>
    </div>
  )

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>My Page</div>
      {/* content */}
    </div>
  )
}
```

2. Add to sidebar nav in `app/dashboard/layout.tsx`:
```ts
{ href: '/dashboard/my-page', icon: '🆕', label: 'My Page' }
```

---

## 🖥️ Tauri — Adding a New Command

1. Define in `src-tauri/src/main.rs`:
```rust
#[tauri::command]
fn my_command(param: String) -> String {
    format!("Hello from Rust: {}", param)
}

// Register in .invoke_handler():
.invoke_handler(tauri::generate_handler![
  // ... existing commands
  my_command,
])
```

2. Call from JavaScript:
```ts
import { invoke } from '@tauri-apps/api/tauri'

const result = await invoke('my_command', { param: 'world' })
console.log(result) // "Hello from Rust: world"
```

### Tauri File System (save reports to disk)
```ts
import { save } from '@tauri-apps/api/dialog'
import { writeTextFile } from '@tauri-apps/api/fs'

const path = await save({ filters: [{ name: 'CSV', extensions: ['csv'] }] })
if (path) await writeTextFile(path, csvContent)
```

---

## 🎨 Design System

### CSS Variables
```css
--bg: #0A0A0F          /* Page background */
--surface: #111118      /* Sidebar, topbar */
--card: #16161F         /* Cards, panels */
--border: #1E1E2E       /* Borders */
--accent: #E8A020       /* Primary gold */
--accent-dim: rgba(232,160,32,0.12)  /* Accent tint bg */
--red: #E84040          /* Danger, error */
--green: #20C878        /* Success, confirmed */
--blue: #3D7EFF         /* Info, regular seats */
--purple: #9B59F5       /* VIP, special */
--text: #F0EEE8         /* Primary text */
--muted: #6B6B80        /* Secondary text */
--subtle: #1E1E2E       /* Subtle backgrounds */
--font-display: 'Playfair Display'  /* Headings */
--font-mono: 'JetBrains Mono'       /* Numbers, codes */
--font-body: 'DM Sans'              /* Body text */
```

### Reusable CSS Classes (from globals.css)
| Class | Usage |
|-------|-------|
| `.cp-card` | Standard card container with hover border |
| `.cp-input` | Styled form input (text, select, textarea) |
| `.cp-table` | Table with dark theme styling |
| `.btn .btn-primary` | Gold primary button |
| `.btn .btn-ghost` | Outlined secondary button |
| `.btn .btn-danger` | Red destructive button |
| `.btn .btn-sm` | Small button variant |
| `.btn .btn-full` | Full-width button |
| `.badge .badge-confirmed` | Green status badge |
| `.badge .badge-pending` | Gold status badge |
| `.badge .badge-cancelled` | Red status badge |
| `.modal-backdrop` | Full-screen modal overlay |
| `.modal-box` | Modal container |
| `.spinner` | Loading spinner animation |
| `.animate-fadeIn` | Fade-in on mount |
| `.animate-slideIn` | Slide in from right |
| `.hide-mobile` | Hidden on screens < 768px |

### Seat Classes
| Class | Seat State |
|-------|-----------|
| `.seat-vip` | Available VIP (purple) |
| `.seat-premium` | Available Premium (gold) |
| `.seat-regular` | Available Regular (blue) |
| `.seat-booked` | Booked (grey, not clickable) |
| `.seat-locked` | Locked by someone else (red) |
| `.seat-selected` | Selected by current user (gold fill) |

---

## 🛠️ Common Development Tasks

### Reset Database (re-seed)
```bash
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Add a New Prisma Migration (PostgreSQL)
```bash
npx prisma migrate dev --name add_wallet_balance
```

### View Database in Browser
```bash
npm run db:studio
# Opens Prisma Studio at localhost:5555
```

### Type Check Without Building
```bash
npx tsc --noEmit
```

### Lint
```bash
npm run lint
```

### Build for Production Web
```bash
npm run build
npm run start
```

### Build Tauri Desktop
```bash
# Install Rust first: https://rustup.rs
npm run tauri:build
# Output: src-tauri/target/release/bundle/
#   macOS:   *.dmg, *.app
#   Windows: *.msi, *.exe
#   Linux:   *.AppImage, *.deb
```

---

## 📦 Dependencies Reference

| Package | Purpose |
|---------|---------|
| `next` | Full-stack React framework (App Router) |
| `react` + `react-dom` | UI library |
| `@prisma/client` + `prisma` | ORM + DB migrations |
| `zustand` | Client state management |
| `zod` | Runtime schema validation |
| `bcryptjs` | Password hashing |
| `jose` | JWT sign/verify |
| `date-fns` | Date formatting/manipulation |
| `recharts` | Charts (Area, Bar, Pie) |
| `qrcode` | QR code generation for tickets |
| `uuid` | Unique ID generation |
| `@tauri-apps/cli` | Tauri desktop build tooling |
| `tailwindcss` | Utility CSS (minimal usage) |
| `autoprefixer` | CSS vendor prefixes |

---

## 🧪 Testing Guide

### Manual Test Checklist
- [ ] Login with all 3 roles — verify nav item visibility
- [ ] Create a show, select seats, complete POS booking
- [ ] Apply coupon `FIRST50` — verify 50% discount
- [ ] Cancel a booking >60min before show — verify full refund
- [ ] Try to book already-booked seats — verify conflict error
- [ ] Let seat lock expire — verify seats released
- [ ] Add a movie with all formats — verify in shows scheduler
- [ ] Add a staff member, login as them, verify role restrictions
- [ ] Check analytics page with 7D / 30D range
- [ ] Print ticket — verify QR code renders

### Useful Test Credentials
```
admin@cinepos.com   / admin123  → SUPER_ADMIN (full access)
manager@cinepos.com / clerk123  → MANAGER (no staff delete)
clerk@cinepos.com   / clerk123  → CLERK (booking only)
```

### Test Coupons (from seed)
```
FIRST50  → 50% off, max ₹200, min order ₹500
FLAT100  → ₹100 flat off, min order ₹300
VIP200   → ₹200 flat off, min order ₹800
```

---

*CinePOS v1.0.0 · Built with Next.js 14 + Tauri v1 + Prisma + Zustand*
