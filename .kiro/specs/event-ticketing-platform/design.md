# Event Ticketing Platform — Design Document

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Ticketing Platform                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Customer   │  │  Organizer   │  │ Venue Manager│       │
│  │   Portal     │  │  Dashboard   │  │  Dashboard   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                  │               │
│  ┌──────────────────────────────────────────────────┐        │
│  │         API Layer (Next.js Routes)              │        │
│  ├──────────────────────────────────────────────────┤        │
│  │ /api/events  /api/venues  /api/tickets          │        │
│  │ /api/waitlist  /api/resale  /api/validate       │        │
│  └──────────────────────────────────────────────────┘        │
│         │                 │                  │               │
│  ┌──────────────────────────────────────────────────┐        │
│  │      Business Logic Layer (lib/)                │        │
│  ├──────────────────────────────────────────────────┤        │
│  │ ticket-lock.ts  pricing-engine.ts               │        │
│  │ waitlist-queue.ts  resale-handler.ts            │        │
│  │ ticket-validator.ts  notification-handler.ts    │        │
│  └──────────────────────────────────────────────────┘        │
│         │                 │                  │               │
│  ┌──────────────────────────────────────────────────┐        │
│  │      Data Layer (Prisma ORM)                    │        │
│  ├──────────────────────────────────────────────────┤        │
│  │ Event  Venue  TicketTier  TicketLock            │        │
│  │ Waitlist  TicketResale  Ticket  Review          │        │
│  └──────────────────────────────────────────────────┘        │
│         │                 │                  │               │
│  ┌──────────────────────────────────────────────────┐        │
│  │      Database (SQLite/PostgreSQL)               │        │
│  └──────────────────────────────────────────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## System Components

### 1. Ticket Locking System (Adapted from CinePOS)

**File:** `lib/ticket-lock.ts`

```typescript
// Quantity-based locking for standing room / general admission
async function lockTickets(
  eventId: string,
  ticketTierId: string,
  quantity: number,
  sessionId: string
): Promise<{ success: boolean; conflict?: number }>

// Unlock tickets when user abandons cart
async function unlockTickets(
  eventId: string,
  ticketTierId: string,
  quantity: number,
  sessionId: string
): Promise<void>

// Get real-time availability
async function getTicketAvailability(eventId: string): Promise<{
  tiers: Array<{
    tierId: string
    available: number
    locked: number
    sold: number
  }>
}>
```

**Key Differences from Seat Locking:**
- Seat locking: 1 seat = 1 lock entry
- Ticket locking: N tickets = 1 lock entry with quantity field
- Unique constraint: `(eventId, ticketTierId, sessionId)` instead of `(showId, seatId)`

---

### 2. Dynamic Pricing Engine

**File:** `lib/pricing-engine.ts`

```typescript
interface PricingFactors {
  basePrice: number
  daysUntilEvent: number
  inventoryPercentage: number
  bookingsInLast24h: number
  eventCategory: string
}

async function calculateDynamicPrice(factors: PricingFactors): Promise<number> {
  let multiplier = 1.0
  
  // Time-based surge
  if (factors.daysUntilEvent <= 7) multiplier += 0.5
  if (factors.daysUntilEvent <= 3) multiplier += 0.25
  if (factors.daysUntilEvent <= 1) multiplier += 0.25
  
  // Inventory-based surge
  if (factors.inventoryPercentage < 50) multiplier += 0.25
  if (factors.inventoryPercentage < 20) multiplier += 0.25
  if (factors.inventoryPercentage < 10) multiplier += 0.5
  
  // Demand-based surge
  if (factors.bookingsInLast24h > 100) multiplier += 0.25
  if (factors.bookingsInLast24h > 500) multiplier += 0.5
  
  return Math.round(factors.basePrice * multiplier)
}
```

---

### 3. Waitlist Queue System

**File:** `lib/waitlist-queue.ts`

```typescript
async function addToWaitlist(
  eventId: string,
  customerId: string,
  ticketTierId: string,
  quantity: number
): Promise<{ position: number; estimatedWaitTime: string }>

async function notifyWaitlist(
  eventId: string,
  ticketTierId: string,
  availableQuantity: number
): Promise<{ notified: number; converted: number }>

async function convertWaitlistToBooking(
  waitlistId: string,
  customerId: string
): Promise<{ success: boolean; bookingId?: string }>

async function expireWaitlistEntries(): Promise<number>
```

**Waitlist Priority:**
- FIFO (first-in-first-out) by default
- VIP tier customers get priority
- Notification window: 1 hour to accept

---

### 4. Resale Marketplace Handler

**File:** `lib/resale-handler.ts`

```typescript
async function listTicketForResale(
  ticketId: string,
  sellerId: string,
  resalePrice: number
): Promise<{ success: boolean; listingId?: string }>

async function validateResalePrice(
  originalPrice: number,
  resalePrice: number
): Promise<{ valid: boolean; reason?: string }>

async function purchaseResaleTicket(
  listingId: string,
  buyerId: string,
  paymentMethod: string
): Promise<{ success: boolean; bookingId?: string }>

async function calculateCommission(
  resalePrice: number,
  platformRate: number = 0.15
): Promise<{ commission: number; sellerProceeds: number }>
```

**Resale Rules:**
- Can't resale within 24h of purchase
- Can't resale after event starts
- Price bounds: 80-150% of original price
- Max 3 resales per ticket
- Platform takes 15% commission

---

### 5. Ticket Validator

**File:** `lib/ticket-validator.ts`

```typescript
async function validateTicketAtEntry(
  ticketId: string,
  qrCode: string
): Promise<{ valid: boolean; ticket?: Ticket; reason?: string }>

async function markTicketAsUsed(ticketId: string): Promise<void>

async function generateEntryReport(
  eventId: string,
  date: Date
): Promise<{
  totalTickets: number
  entriesScanned: number
  duplicateAttempts: number
  invalidTickets: number
}>
```

---

### 6. Pricing Tier Management

**File:** `lib/tier-manager.ts`

```typescript
async function createTicketTier(
  eventId: string,
  sectionId: string,
  tierData: {
    name: string
    basePrice: number
    capacity: number
    features: string[]
    availableFrom: Date
    availableUntil: Date
  }
): Promise<TicketTier>

async function updateTierPricing(
  tierId: string,
  newBasePrice: number
): Promise<void>

async function getTierAvailability(tierId: string): Promise<{
  total: number
  sold: number
  locked: number
  available: number
  soldPercentage: number
}>
```

---

## Database Schema Changes

### New Tables

```sql
-- Events
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  eventType TEXT,
  startDate DATETIME,
  endDate DATETIME,
  venueId TEXT,
  organizerId TEXT,
  posterUrl TEXT,
  status TEXT DEFAULT 'DRAFT',
  capacity INT,
  refundPolicy TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME,
  FOREIGN KEY (venueId) REFERENCES venues(id),
  FOREIGN KEY (organizerId) REFERENCES users(id)
);

-- Venues
CREATE TABLE venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  capacity INT,
  amenities TEXT,
  accessibility TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Venue Sections
CREATE TABLE venue_sections (
  id TEXT PRIMARY KEY,
  venueId TEXT NOT NULL,
  name TEXT,
  capacity INT,
  coordX FLOAT,
  coordY FLOAT,
  FOREIGN KEY (venueId) REFERENCES venues(id)
);

-- Ticket Tiers
CREATE TABLE ticket_tiers (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL,
  sectionId TEXT,
  name TEXT,
  basePrice FLOAT,
  currentPrice FLOAT,
  totalCapacity INT,
  soldCount INT DEFAULT 0,
  availableCount INT,
  features TEXT,
  availableFrom DATETIME,
  availableUntil DATETIME,
  createdAt DATETIME,
  FOREIGN KEY (eventId) REFERENCES events(id),
  FOREIGN KEY (sectionId) REFERENCES venue_sections(id)
);

-- Ticket Locks (Adapted from SeatLock)
CREATE TABLE ticket_locks (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL,
  ticketTierId TEXT NOT NULL,
  quantity INT,
  sessionId TEXT,
  expiresAt DATETIME,
  createdAt DATETIME,
  UNIQUE(eventId, ticketTierId, sessionId),
  FOREIGN KEY (eventId) REFERENCES events(id),
  FOREIGN KEY (ticketTierId) REFERENCES ticket_tiers(id)
);

-- Waitlist
CREATE TABLE waitlist (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  ticketTierId TEXT NOT NULL,
  quantity INT,
  priority INT,
  status TEXT DEFAULT 'WAITING',
  createdAt DATETIME,
  expiresAt DATETIME,
  convertedAt DATETIME,
  FOREIGN KEY (eventId) REFERENCES events(id),
  FOREIGN KEY (customerId) REFERENCES users(id),
  FOREIGN KEY (ticketTierId) REFERENCES ticket_tiers(id)
);

-- Ticket Resale
CREATE TABLE ticket_resales (
  id TEXT PRIMARY KEY,
  originalBookingId TEXT,
  sellerId TEXT NOT NULL,
  buyerId TEXT,
  ticketId TEXT NOT NULL,
  resalePrice FLOAT,
  platformCommission FLOAT,
  sellerProceeds FLOAT,
  status TEXT DEFAULT 'LISTED',
  listedAt DATETIME,
  soldAt DATETIME,
  FOREIGN KEY (originalBookingId) REFERENCES bookings(id),
  FOREIGN KEY (sellerId) REFERENCES users(id),
  FOREIGN KEY (buyerId) REFERENCES users(id),
  FOREIGN KEY (ticketId) REFERENCES tickets(id)
);

-- Tickets (Enhanced)
CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  bookingId TEXT,
  eventId TEXT NOT NULL,
  ticketTierId TEXT NOT NULL,
  ticketNumber TEXT UNIQUE,
  qrCode TEXT,
  barcode TEXT,
  status TEXT DEFAULT 'ACTIVE',
  customerName TEXT,
  customerEmail TEXT,
  customerPhone TEXT,
  entryTime DATETIME,
  createdAt DATETIME,
  FOREIGN KEY (bookingId) REFERENCES bookings(id),
  FOREIGN KEY (eventId) REFERENCES events(id),
  FOREIGN KEY (ticketTierId) REFERENCES ticket_tiers(id)
);

-- Reviews
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  rating INT,
  comment TEXT,
  createdAt DATETIME,
  FOREIGN KEY (eventId) REFERENCES events(id),
  FOREIGN KEY (customerId) REFERENCES users(id)
);

-- Event Organizers
CREATE TABLE event_organizers (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL UNIQUE,
  companyName TEXT,
  description TEXT,
  website TEXT,
  phone TEXT,
  bankAccount TEXT,
  commissionRate FLOAT,
  createdAt DATETIME,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## API Flow Diagrams

### Ticket Purchase Flow

```
Customer → Browse Events
         → Select Event
         → Choose Tier & Quantity
         → Lock Tickets (5 min)
         → Add to Cart
         → Checkout
         → Payment Processing
         → Create Booking
         → Generate Tickets (QR/Barcode)
         → Send Confirmation (Email/SMS)
         → Unlock Expired Locks
```

### Waitlist Conversion Flow

```
Event Sells Out
         → Customer Joins Waitlist
         → Waitlist Entry Created (7 day expiry)
         → Ticket Released (Refund/Cancellation)
         → Notify Waitlist (FIFO)
         → Customer Accepts (1 hour window)
         → Auto-Create Booking
         → Generate Tickets
         → Send Confirmation
         → Mark Waitlist as CONVERTED
```

### Resale Flow

```
Customer Has Ticket
         → List for Resale
         → Validate Price (80-150% bounds)
         → Create Listing
         → Buyer Browses Marketplace
         → Buyer Purchases
         → Payment Processing
         → Transfer Ticket Ownership
         → Calculate Commission (15%)
         → Send Proceeds to Seller
         → Mark Listing as SOLD
```

---

## Performance Considerations

### 1. Real-time Availability
- Cache tier availability in Redis (5 second TTL)
- Update cache on every lock/unlock/purchase
- Fallback to DB if cache miss

### 2. Concurrent Bookings
- Use atomic upsert for ticket locks (prevents race conditions)
- Unique constraint on (eventId, ticketTierId, sessionId)
- Transaction-based booking creation

### 3. Waitlist Processing
- Batch process waitlist notifications (every 30 seconds)
- Use job queue (BullMQ) for async notifications
- Parallel processing for multiple tiers

### 4. Resale Marketplace
- Index on status, listedAt for fast queries
- Pagination (20 items per page)
- Search by event, tier, price range

---

## Security Considerations

### 1. Ticket Validation
- QR code includes event ID + ticket ID + hash
- Hash prevents tampering
- One-time scan (mark as USED)
- Prevent duplicate entry

### 2. Resale Restrictions
- Verify seller owns ticket
- Verify buyer identity
- Prevent resale after event starts
- Prevent resale within 24h of purchase

### 3. Pricing Integrity
- Validate tier exists before locking
- Validate price hasn't changed during checkout
- Use locked price at purchase time

### 4. Waitlist Fairness
- FIFO ordering prevents queue jumping
- 1-hour acceptance window prevents hoarding
- Auto-expiry after 7 days

---

## Monitoring & Analytics

### Key Metrics
- Ticket sales per tier (real-time)
- Waitlist queue length
- Resale marketplace activity
- Entry validation success rate
- Average ticket purchase time
- Peak concurrent users

### Dashboards
- **Organizer:** Event performance, revenue, attendee breakdown
- **Venue Manager:** Occupancy, section utilization
- **Admin:** Platform metrics, fraud detection

---

## Rollout Strategy

### Week 1-2: Core System
- Event CRUD, venue management
- Basic ticket tiers, booking flow
- Ticket generation (QR/barcode)

### Week 3-4: Advanced Features
- Dynamic pricing engine
- Waitlist system
- Resale marketplace

### Week 5-6: Polish & Scale
- Ticket validation at entry
- Organizer analytics dashboard
- Performance optimization
- Load testing (10k concurrent users)

---

## Success Criteria

✅ Event creation: <5 minutes
✅ Ticket purchase: <2 minutes
✅ Availability update: <1 second
✅ Waitlist conversion: >80% within 24h
✅ Resale adoption: >20% of sold tickets
✅ Zero double-bookings
✅ >95% uptime during peak hours
✅ <100ms API response time (p95)
