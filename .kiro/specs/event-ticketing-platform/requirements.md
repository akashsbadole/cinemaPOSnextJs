# Event Ticketing Platform — Requirements Document

## Overview
Extend CinePOS into a multi-purpose event ticketing platform supporting concerts, sports, conferences, and festivals. Leverage existing seat locking, payment, and ticket generation systems while adding event-specific features.

---

## 1. Core Requirements

### 1.1 Event Management
- **Create Events** with title, description, category (Concert, Sports, Conference, Festival, Theater, Comedy, etc.)
- **Event Details:** Date/time, duration, location, organizer, capacity, event image/poster
- **Event Status:** DRAFT → PUBLISHED → LIVE → COMPLETED → CANCELLED
- **Event Types:** Single-day, multi-day, recurring events
- **Organizer Management:** Create/manage events as organizer, view analytics

### 1.2 Venue Management
- **Venue Registry:** Name, location, address, capacity, amenities, accessibility info
- **Venue Layouts:** Multiple layout configurations per venue (concert stage, theater seating, standing room)
- **Venue Sections:** Define sections (VIP, General, Balcony, Floor, etc.) with capacity per section
- **Venue Mapping:** Visual venue map with section boundaries

### 1.3 Tier-Based Seating
- **Ticket Tiers:** Define multiple ticket types per event (VIP, Premium, General, Early Bird, Last Minute)
- **Dynamic Pricing:** Base price + surge pricing based on demand/time
- **Tier Capacity:** Set max tickets per tier
- **Tier Features:** Perks per tier (early entry, merchandise, meet & greet, etc.)
- **Tier Availability:** Time-based availability (early bird only first 48h, etc.)

### 1.4 Seat/Section Locking
- **Reuse Existing:** Adapt seat-lock.ts for sections/standing areas
- **Lock Duration:** Configurable per event (5-15 minutes)
- **Lock Expiry:** Auto-release expired locks
- **Conflict Prevention:** Atomic upsert prevents overbooking

### 1.5 Ticket Inventory
- **Ticket Pool:** Total tickets per tier
- **Real-time Availability:** Live ticket count per tier
- **Inventory Alerts:** Low stock warnings (20%, 10%, 5%)
- **Overselling:** Optional 5-10% overselling for standing room

### 1.6 Waitlist System
- **Waitlist Queue:** When event sells out, add to waitlist
- **Priority:** FIFO (first-in-first-out) or priority-based (VIP first)
- **Notifications:** Notify when tickets become available
- **Conversion:** Auto-convert waitlist to booking when tickets released
- **Expiry:** Waitlist entries expire after 7 days

### 1.7 Resale Marketplace
- **Ticket Resale:** Allow customers to resell tickets
- **Resale Price:** Set custom price (min/max bounds)
- **Resale Commission:** Platform takes 10-20% commission
- **Resale Restrictions:** Prevent resale after event starts, limit resales per ticket
- **Resale Verification:** Verify buyer identity before transfer
- **Resale History:** Track ticket ownership chain

### 1.8 Booking Flow (Enhanced)
- **Event Selection:** Browse events by category, date, location
- **Tier Selection:** Choose ticket tier with pricing display
- **Quantity Selection:** Buy multiple tickets (1-10 per transaction)
- **Seat/Section Selection:** For seated events, select specific seats; for standing, just quantity
- **Add-ons:** Merchandise, parking, insurance, VIP packages
- **Promo Codes:** Apply coupons/promo codes (reuse existing)
- **Payment:** Multiple methods (card, UPI, wallet, bank transfer)
- **Confirmation:** Booking ref + ticket details

### 1.9 Ticket Management
- **Ticket Delivery:** Email, SMS, app download, print
- **Ticket Formats:** QR code, barcode, PDF, mobile wallet (Apple Wallet, Google Pay)
- **Ticket Validation:** Scan at entry to verify authenticity
- **Ticket Transfer:** Transfer to another person (with restrictions)
- **Ticket Refund:** Based on event cancellation/refund policy

### 1.10 Customer Portal
- **Browse Events:** Search, filter by category/date/location/price
- **Event Details:** Full info, reviews, seating map, pricing tiers
- **My Bookings:** View all tickets, download, transfer, resell
- **Wishlist:** Save events for later
- **Order History:** Past events attended

---

## 2. Reusable Components (from CinePOS)

### 2.1 Seat Locking System
**File:** `lib/seat-lock.ts`
- Adapt for event sections/standing areas
- Change: `seatId` → `ticketTierId` or `sectionId`
- Reuse: Atomic upsert, TTL expiry, conflict detection
- New: Support for quantity-based locking (standing room)

### 2.2 Payment Processing
**File:** `app/api/bookings/route.ts`
- Reuse: Payment method selection, transaction creation
- Adapt: Booking → Ticket purchase, seats → ticket tiers
- New: Resale payment handling, commission calculation

### 2.3 Ticket Generation
**File:** `lib/ticket.ts`
- Reuse: QR code, barcode, PDF generation
- Adapt: Movie ticket → Event ticket
- New: Mobile wallet integration (Apple Wallet, Google Pay)

### 2.4 Notifications
**File:** `lib/notifications.ts`
- Reuse: SMS, email, WhatsApp
- Adapt: Booking confirmation → Ticket confirmation
- New: Waitlist notifications, resale alerts, event reminders

### 2.5 Analytics & Reports
**File:** `app/api/reports/route.ts`
- Reuse: Revenue, occupancy, customer retention
- Adapt: Movie analytics → Event analytics
- New: Tier-wise sales, resale metrics, waitlist conversion

### 2.6 RBAC & Authentication
**File:** `lib/auth.ts`
- Reuse: JWT, role hierarchy
- New Roles: ORGANIZER, VENUE_MANAGER, TICKET_CHECKER, CUSTOMER

### 2.7 Coupons & Promo Codes
**File:** `app/api/coupons/route.ts`
- Reuse: PERCENT/FLAT discount types, usage limits
- Adapt: Movie coupons → Event promo codes
- New: Event-specific codes, tier-specific discounts

---

## 3. New Database Models

### 3.1 Event Model
```
Event {
  id: String @id
  title: String
  description: String
  category: String (Concert, Sports, Conference, Festival, Theater, Comedy)
  eventType: String (Single-day, Multi-day, Recurring)
  startDate: DateTime
  endDate: DateTime
  venueId: String
  organizerId: String
  posterUrl: String
  bannerUrl: String
  status: String (DRAFT, PUBLISHED, LIVE, COMPLETED, CANCELLED)
  capacity: Int
  refundPolicy: String (Full, Partial, None)
  createdAt: DateTime
  updatedAt: DateTime
  
  venue: Venue
  organizer: User
  ticketTiers: TicketTier[]
  bookings: Booking[]
  reviews: Review[]
}
```

### 3.2 Venue Model
```
Venue {
  id: String @id
  name: String
  location: String
  address: String
  city: String
  state: String
  country: String
  capacity: Int
  amenities: String[] (WiFi, Parking, Restrooms, etc.)
  accessibility: String[] (Wheelchair, Elevator, etc.)
  createdAt: DateTime
  
  sections: VenueSection[]
  events: Event[]
}
```

### 3.3 VenueSection Model
```
VenueSection {
  id: String @id
  venueId: String
  name: String (VIP, General, Balcony, Floor, etc.)
  capacity: Int
  coordX: Float
  coordY: Float
  
  venue: Venue
  ticketTiers: TicketTier[]
}
```

### 3.4 TicketTier Model
```
TicketTier {
  id: String @id
  eventId: String
  sectionId: String
  name: String (VIP, Premium, General, Early Bird)
  basePrice: Float
  currentPrice: Float (with surge pricing)
  totalCapacity: Int
  soldCount: Int
  availableCount: Int
  features: String[] (Early entry, Merchandise, Meet & Greet)
  availableFrom: DateTime
  availableUntil: DateTime
  createdAt: DateTime
  
  event: Event
  section: VenueSection
  ticketLocks: TicketLock[]
  bookings: Booking[]
}
```

### 3.5 TicketLock Model (Adapted from SeatLock)
```
TicketLock {
  id: String @id
  eventId: String
  ticketTierId: String
  quantity: Int (for standing room)
  sessionId: String
  expiresAt: DateTime
  createdAt: DateTime
  
  event: Event
  ticketTier: TicketTier
  
  @@unique([eventId, ticketTierId, sessionId])
}
```

### 3.6 Waitlist Model
```
Waitlist {
  id: String @id
  eventId: String
  customerId: String
  ticketTierId: String
  quantity: Int
  priority: Int (FIFO order)
  status: String (WAITING, NOTIFIED, CONVERTED, EXPIRED)
  createdAt: DateTime
  expiresAt: DateTime
  convertedAt: DateTime
  
  event: Event
  customer: User
  ticketTier: TicketTier
}
```

### 3.7 TicketResale Model
```
TicketResale {
  id: String @id
  originalBookingId: String
  sellerId: String
  buyerId: String
  ticketId: String
  resalePrice: Float
  platformCommission: Float
  sellerProceeds: Float
  status: String (LISTED, SOLD, CANCELLED)
  listedAt: DateTime
  soldAt: DateTime
  
  originalBooking: Booking
  seller: User
  buyer: User
  ticket: Ticket
}
```

### 3.8 Ticket Model (Enhanced)
```
Ticket {
  id: String @id
  bookingId: String
  eventId: String
  ticketTierId: String
  ticketNumber: String (unique per event)
  qrCode: String
  barcode: String
  status: String (ACTIVE, USED, TRANSFERRED, REFUNDED)
  customerName: String
  customerEmail: String
  customerPhone: String
  entryTime: DateTime
  resales: TicketResale[]
  createdAt: DateTime
  
  booking: Booking
  event: Event
  ticketTier: TicketTier
}
```

### 3.9 Review Model
```
Review {
  id: String @id
  eventId: String
  customerId: String
  rating: Int (1-5)
  comment: String
  createdAt: DateTime
  
  event: Event
  customer: User
}
```

### 3.10 EventOrganizer Model
```
EventOrganizer {
  id: String @id
  userId: String
  companyName: String
  description: String
  website: String
  phone: String
  bankAccount: String (for payouts)
  commissionRate: Float (platform takes %)
  createdAt: DateTime
  
  user: User
  events: Event[]
}
```

---

## 4. New API Endpoints

### 4.1 Event Management
- `GET /api/events` - List all events (with filters)
- `GET /api/events/[id]` - Event details
- `POST /api/events` - Create event (organizer)
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Cancel event
- `GET /api/events/[id]/analytics` - Event analytics

### 4.2 Venue Management
- `GET /api/venues` - List venues
- `POST /api/venues` - Create venue
- `GET /api/venues/[id]` - Venue details with sections
- `POST /api/venues/[id]/sections` - Add section

### 4.3 Ticket Tiers
- `GET /api/events/[id]/tiers` - List tiers for event
- `POST /api/events/[id]/tiers` - Create tier
- `PUT /api/tiers/[id]` - Update tier (pricing, capacity)
- `GET /api/tiers/[id]/availability` - Real-time availability

### 4.4 Ticket Locking (Adapted)
- `POST /api/tickets/lock` - Lock tickets (quantity-based)
- `DELETE /api/tickets/lock` - Unlock tickets
- `GET /api/events/[id]/availability` - Real-time ticket availability

### 4.5 Booking/Purchase
- `POST /api/tickets/purchase` - Buy tickets
- `GET /api/bookings/[id]/tickets` - Get tickets for booking
- `GET /api/my-tickets` - Customer's tickets

### 4.6 Waitlist
- `POST /api/waitlist` - Join waitlist
- `GET /api/waitlist/[id]` - Waitlist status
- `DELETE /api/waitlist/[id]` - Leave waitlist

### 4.7 Resale Marketplace
- `POST /api/resale/list` - List ticket for resale
- `GET /api/resale/marketplace` - Browse resale tickets
- `POST /api/resale/[id]/purchase` - Buy resale ticket
- `DELETE /api/resale/[id]` - Delist ticket

### 4.8 Ticket Validation
- `POST /api/tickets/validate` - Scan & validate ticket at entry
- `POST /api/tickets/[id]/transfer` - Transfer ticket to another person

### 4.9 Reviews
- `POST /api/events/[id]/reviews` - Post review
- `GET /api/events/[id]/reviews` - Get event reviews

---

## 5. New Frontend Pages

### 5.1 Customer-Facing
- `/events` - Browse all events
- `/events/[id]` - Event details page
- `/events/[id]/book` - Booking flow
- `/my-tickets` - My tickets/bookings
- `/resale-marketplace` - Browse resale tickets
- `/event-reviews` - Event reviews & ratings

### 5.2 Organizer Dashboard
- `/organizer/dashboard` - Overview
- `/organizer/events` - Manage events
- `/organizer/events/[id]/analytics` - Event analytics
- `/organizer/events/[id]/settings` - Event settings
- `/organizer/payouts` - Revenue & payouts

### 5.3 Venue Manager
- `/venue/dashboard` - Venue overview
- `/venue/events` - Events at venue
- `/venue/sections` - Manage sections

### 5.4 Ticket Checker
- `/check-in` - Scan & validate tickets at entry

---

## 6. Key Features to Implement

### 6.1 Dynamic Pricing
- Base price + surge pricing based on:
  - Time to event (closer = higher)
  - Inventory level (lower stock = higher)
  - Demand (more bookings = higher)
- Formula: `currentPrice = basePrice × (1 + demandMultiplier + timeMultiplier)`

### 6.2 Surge Pricing Rules
- 0-7 days before: +50%
- 0-3 days before: +75%
- <50% inventory: +25%
- <20% inventory: +50%
- <10% inventory: +100%

### 6.3 Waitlist Auto-Conversion
- When ticket released (refund/cancellation), auto-notify waitlist
- Auto-convert if customer accepts within 1 hour
- Move to next in queue if declined

### 6.4 Resale Restrictions
- Can't resale after event starts
- Can't resale within 24h of purchase (prevent scalping)
- Max 3 resales per ticket
- Resale price must be within 80-150% of original price

### 6.5 Ticket Validation
- QR code scan at entry
- Mark ticket as USED
- Prevent duplicate entry
- Generate entry report

---

## 7. Integration Points with CinePOS

### 7.1 Reuse Directly
- `lib/auth.ts` - JWT, role hierarchy
- `lib/db.ts` - Prisma client
- `lib/notifications.ts` - SMS, email, WhatsApp
- `lib/ticket.ts` - QR, barcode, PDF generation
- `app/api/coupons/route.ts` - Promo code validation
- `app/api/reports/route.ts` - Analytics framework

### 7.2 Adapt Existing
- `lib/seat-lock.ts` → `lib/ticket-lock.ts` (quantity-based)
- `app/api/bookings/route.ts` → `app/api/tickets/purchase` (payment flow)
- `app/dashboard/analytics/page.tsx` → Event analytics dashboard

### 7.3 New Implementations
- Event management system
- Venue & section management
- Tier-based pricing engine
- Waitlist queue system
- Resale marketplace
- Ticket validation system

---

## 8. Data Migration Strategy

### 8.1 Backward Compatibility
- Keep existing `Show` model for movies
- Add `Event` model for general events
- Reuse `Booking` model (add `eventId` field)
- Reuse `Ticket` model (add `eventId` field)

### 8.2 Migration Path
1. Add new models to Prisma schema
2. Run migration: `npx prisma migrate dev --name add_event_ticketing`
3. Keep existing movie functionality intact
4. Gradually migrate to unified booking system

---

## 9. Success Metrics

- Event creation time: <5 minutes
- Ticket purchase time: <2 minutes
- Ticket availability update: <1 second
- Waitlist conversion: >80% within 24h
- Resale marketplace adoption: >20% of sold tickets
- Customer satisfaction: >4.5/5 stars

---

## 10. Phased Rollout

### Phase 1 (Weeks 1-2): Core Event System
- Event CRUD, venue management, ticket tiers
- Basic booking flow, ticket generation

### Phase 2 (Weeks 3-4): Advanced Features
- Waitlist system, dynamic pricing, resale marketplace

### Phase 3 (Weeks 5-6): Polish & Scale
- Ticket validation, organizer dashboard, analytics
- Performance optimization, load testing

---

## 11. Success Criteria

✅ All events can be created and published
✅ Customers can browse and book tickets
✅ Real-time availability updates
✅ Waitlist auto-converts when tickets available
✅ Resale marketplace functional
✅ Ticket validation at entry works
✅ Analytics show event performance
✅ Zero double-bookings (atomic locking)
✅ <2 second ticket purchase time
✅ >95% uptime during high-demand events
