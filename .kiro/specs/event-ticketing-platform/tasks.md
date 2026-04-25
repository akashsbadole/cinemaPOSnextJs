# Event Ticketing Platform — Implementation Tasks

## Phase 1: Core Event System (Weeks 1-2)

### 1.1 Database Schema & Models
- [ ] Add Event model to Prisma schema
- [ ] Add Venue model to Prisma schema
- [ ] Add VenueSection model to Prisma schema
- [ ] Add TicketTier model to Prisma schema
- [ ] Add TicketLock model (adapted from SeatLock)
- [ ] Add Ticket model (enhanced)
- [ ] Add EventOrganizer model
- [ ] Run migration: `npx prisma migrate dev --name add_event_ticketing`
- [ ] Seed sample events, venues, tiers

### 1.2 Event Management API
- [ ] `GET /api/events` - List events with filters (category, date, location, price)
- [ ] `GET /api/events/[id]` - Event details with tiers, venue, reviews
- [ ] `POST /api/events` - Create event (organizer only)
- [ ] `PUT /api/events/[id]` - Update event details
- [ ] `DELETE /api/events/[id]` - Cancel event
- [ ] `GET /api/events/[id]/availability` - Real-time tier availability
- [ ] Add Zod validation for all endpoints
- [ ] Add RBAC checks (organizer can only edit own events)

### 1.3 Venue Management API
- [ ] `GET /api/venues` - List all venues
- [ ] `POST /api/venues` - Create venue (admin only)
- [ ] `GET /api/venues/[id]` - Venue details with sections
- [ ] `POST /api/venues/[id]/sections` - Add section to venue
- [ ] Add Zod validation

### 1.4 Ticket Tier Management API
- [ ] `GET /api/events/[id]/tiers` - List tiers for event
- [ ] `POST /api/events/[id]/tiers` - Create tier
- [ ] `PUT /api/tiers/[id]` - Update tier (name, capacity, features)
- [ ] `GET /api/tiers/[id]/availability` - Real-time availability
- [ ] Add Zod validation

### 1.5 Ticket Locking System
- [ ] Create `lib/ticket-lock.ts` (adapted from seat-lock.ts)
- [ ] Implement `lockTickets()` - quantity-based locking
- [ ] Implement `unlockTickets()` - release locks
- [ ] Implement `getTicketAvailability()` - real-time counts
- [ ] Add TTL cleanup (5 minute expiry)
- [ ] Add atomic upsert to prevent race conditions
- [ ] Unit tests for locking logic

### 1.6 Ticket Purchase API
- [ ] `POST /api/tickets/purchase` - Buy tickets
  - Validate event exists and is published
  - Validate tier exists and is available
  - Lock tickets (quantity-based)
  - Calculate price (base + dynamic pricing)
  - Apply coupon if provided
  - Create booking + payment
  - Generate tickets (QR + barcode)
  - Send confirmation email/SMS
  - Return booking ref + ticket details
- [ ] Add Zod validation
- [ ] Add transaction handling (atomic booking creation)
- [ ] Add error handling (sold out, invalid tier, etc.)

### 1.7 Ticket Generation (Reuse & Adapt)
- [ ] Adapt `lib/ticket.ts` for event tickets
- [ ] Generate QR code with event ID + ticket ID
- [ ] Generate barcode (Code128)
- [ ] Create PDF ticket with event details
- [ ] Create HTML ticket for email
- [ ] Create thermal printer format
- [ ] Add ticket number generation (unique per event)

### 1.8 Customer Portal - Browse Events
- [ ] Create `/events` page
  - List all published events
  - Filter by category, date, location, price range
  - Search by title
  - Show event poster, date, venue, price range
  - Pagination (20 per page)
- [ ] Create `/events/[id]` page
  - Event details (title, description, date, venue, capacity)
  - Venue map with sections
  - Tier pricing table
  - Customer reviews & ratings
  - "Book Now" button

### 1.9 Customer Portal - Booking Flow
- [ ] Create `/events/[id]/book` page
  - Step 1: Select tier & quantity
  - Step 2: Review pricing (base + surge + discount)
  - Step 3: Customer details (name, email, phone)
  - Step 4: Payment method selection
  - Step 5: Confirmation with booking ref
- [ ] Add real-time availability updates
- [ ] Add coupon code input
- [ ] Add error handling (sold out, invalid quantity, etc.)

### 1.10 Customer Portal - My Tickets
- [ ] Create `/my-tickets` page
  - List all customer's tickets
  - Show event details, tier, seat/section
  - Download ticket (PDF, mobile wallet)
  - Transfer ticket option
  - Resale option (if eligible)
  - Event date countdown

### 1.11 Notifications (Reuse & Adapt)
- [ ] Adapt `lib/notifications.ts` for event confirmations
- [ ] Send booking confirmation (email + SMS)
- [ ] Send ticket details (email attachment)
- [ ] Send event reminder (24h before)
- [ ] Send event reminder (2h before)
- [ ] Send post-event survey

### 1.12 Frontend Components
- [ ] EventCard component (event listing)
- [ ] EventDetails component (full event info)
- [ ] TierSelector component (tier selection with pricing)
- [ ] TicketPreview component (ticket display)
- [ ] BookingFlow component (multi-step booking)
- [ ] AvailabilityBadge component (real-time availability)

---

## Phase 2: Advanced Features (Weeks 3-4)

### 2.1 Dynamic Pricing Engine
- [ ] Create `lib/pricing-engine.ts`
- [ ] Implement `calculateDynamicPrice()` function
  - Time-based surge (closer to event = higher)
  - Inventory-based surge (lower stock = higher)
  - Demand-based surge (more bookings = higher)
- [ ] Add pricing rules configuration
- [ ] Update tier pricing every hour
- [ ] Add pricing history tracking
- [ ] Unit tests for pricing calculations

### 2.2 Waitlist System
- [ ] Add Waitlist model to Prisma schema
- [ ] Create `lib/waitlist-queue.ts`
- [ ] Implement `addToWaitlist()` - join queue
- [ ] Implement `notifyWaitlist()` - notify when tickets available
- [ ] Implement `convertWaitlistToBooking()` - auto-convert
- [ ] Implement `expireWaitlistEntries()` - cleanup after 7 days
- [ ] `POST /api/waitlist` - Join waitlist
- [ ] `GET /api/waitlist/[id]` - Check waitlist status
- [ ] `DELETE /api/waitlist/[id]` - Leave waitlist
- [ ] Add BullMQ job for batch waitlist processing
- [ ] Add 1-hour acceptance window
- [ ] Unit tests for waitlist logic

### 2.3 Waitlist Notifications
- [ ] Send notification when tickets available
- [ ] Send reminder (30 min before expiry)
- [ ] Send confirmation when converted to booking
- [ ] Send expiry notification

### 2.4 Resale Marketplace
- [ ] Add TicketResale model to Prisma schema
- [ ] Create `lib/resale-handler.ts`
- [ ] Implement `listTicketForResale()` - list ticket
- [ ] Implement `validateResalePrice()` - price bounds check
- [ ] Implement `purchaseResaleTicket()` - buy resale ticket
- [ ] Implement `calculateCommission()` - 15% platform fee
- [ ] `POST /api/resale/list` - List ticket for resale
- [ ] `GET /api/resale/marketplace` - Browse resale tickets
- [ ] `POST /api/resale/[id]/purchase` - Buy resale ticket
- [ ] `DELETE /api/resale/[id]` - Delist ticket
- [ ] Add resale restrictions (24h cooldown, price bounds, max 3 resales)
- [ ] Add seller payout calculation
- [ ] Unit tests for resale logic

### 2.5 Resale Marketplace UI
- [ ] Create `/resale-marketplace` page
  - Browse resale tickets
  - Filter by event, tier, price
  - Search by event name
  - Show original price vs resale price
  - Show seller rating
  - "Buy Now" button
- [ ] Create resale listing form
  - Input resale price
  - Show price bounds (80-150%)
  - Show commission calculation
  - Show seller proceeds
- [ ] Add resale purchase flow

### 2.6 Ticket Transfer
- [ ] `POST /api/tickets/[id]/transfer` - Transfer ticket to another person
- [ ] Validate ticket is transferable (not used, not after event)
- [ ] Update ticket customer details
- [ ] Send notification to new owner
- [ ] Add transfer history tracking

### 2.7 Reviews & Ratings
- [ ] Add Review model to Prisma schema
- [ ] `POST /api/events/[id]/reviews` - Post review
- [ ] `GET /api/events/[id]/reviews` - Get event reviews
- [ ] Add review moderation (optional)
- [ ] Display average rating on event page
- [ ] Show recent reviews on event details

### 2.8 Organizer Dashboard - Basic
- [ ] Create `/organizer/dashboard` page
  - Overview of all events
  - Total revenue, bookings, attendees
  - Upcoming events list
  - Recent bookings
- [ ] Create `/organizer/events` page
  - List organizer's events
  - Create new event button
  - Edit/delete event options
  - Quick stats (sold, available, revenue)

---

## Phase 3: Polish & Scale (Weeks 5-6)

### 3.1 Ticket Validation System
- [ ] Create `lib/ticket-validator.ts`
- [ ] Implement `validateTicketAtEntry()` - scan & verify
- [ ] Implement `markTicketAsUsed()` - mark as scanned
- [ ] Implement `generateEntryReport()` - entry statistics
- [ ] `POST /api/tickets/validate` - Validate ticket at entry
- [ ] Add QR code verification (hash check)
- [ ] Add duplicate entry prevention
- [ ] Add entry time tracking
- [ ] Unit tests for validation logic

### 3.2 Ticket Checker Portal
- [ ] Create `/check-in` page
  - QR code scanner input
  - Manual ticket number input
  - Validate ticket
  - Show ticket details (customer, tier, seat)
  - Mark as used
  - Show success/error message
- [ ] Add offline mode (cache tickets locally)
- [ ] Add entry report generation

### 3.3 Organizer Analytics Dashboard
- [ ] Create `/organizer/events/[id]/analytics` page
  - Revenue chart (daily, cumulative)
  - Bookings chart (daily, cumulative)
  - Tier-wise sales breakdown
  - Occupancy by section
  - Customer demographics
  - Refund/cancellation stats
  - Waitlist conversion rate
  - Resale marketplace activity
- [ ] Add date range selector
- [ ] Add export to CSV/PDF

### 3.4 Organizer Event Settings
- [ ] Create `/organizer/events/[id]/settings` page
  - Event details (edit)
  - Tier management (add/edit/delete)
  - Pricing rules (base price, surge pricing)
  - Refund policy
  - Cancellation policy
  - Notification settings
  - Organizer payout details

### 3.5 Organizer Payouts
- [ ] Create `/organizer/payouts` page
  - Revenue summary
  - Payout history
  - Pending payouts
  - Bank account details
  - Payout schedule
- [ ] `GET /api/organizer/payouts` - Get payout info
- [ ] `POST /api/organizer/payouts/request` - Request payout
- [ ] Add payout processing (weekly/monthly)

### 3.6 Venue Manager Dashboard
- [ ] Create `/venue/dashboard` page
  - Venue overview
  - Events at venue (upcoming, past)
  - Total revenue, bookings
  - Occupancy trends
- [ ] Create `/venue/events` page
  - List events at venue
  - View event details
  - See occupancy per section
- [ ] Create `/venue/sections` page
  - Manage sections
  - View section capacity
  - See section utilization

### 3.7 Admin Dashboard
- [ ] Create `/admin/dashboard` page
  - Platform metrics (total events, bookings, revenue)
  - Top events, organizers, venues
  - Fraud detection alerts
  - System health
- [ ] Create `/admin/events` page
  - Manage all events
  - Approve/reject events
  - View event details
- [ ] Create `/admin/organizers` page
  - Manage organizers
  - View organizer stats
  - Handle disputes

### 3.8 Performance Optimization
- [ ] Add Redis caching for tier availability
- [ ] Add database indexing (eventId, tierId, status)
- [ ] Optimize API queries (N+1 prevention)
- [ ] Add pagination to all list endpoints
- [ ] Implement lazy loading for images
- [ ] Add CDN for event posters/banners
- [ ] Optimize ticket generation (batch processing)

### 3.9 Load Testing
- [ ] Setup load testing environment
- [ ] Test concurrent ticket purchases (1000+ users)
- [ ] Test waitlist processing (10000+ entries)
- [ ] Test resale marketplace (5000+ listings)
- [ ] Measure response times (target: <100ms p95)
- [ ] Identify bottlenecks
- [ ] Optimize based on results

### 3.10 Security Hardening
- [ ] Add rate limiting to booking API
- [ ] Add CSRF protection
- [ ] Add input sanitization (XSS prevention)
- [ ] Add SQL injection prevention (Prisma handles this)
- [ ] Add ticket validation hash verification
- [ ] Add fraud detection (unusual patterns)
- [ ] Add audit logging (all transactions)
- [ ] Security testing & penetration testing

### 3.11 Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guides (customer, organizer, venue manager)
- [ ] Admin guides
- [ ] Deployment guide
- [ ] Troubleshooting guide

### 3.12 Testing
- [ ] Unit tests for all business logic
- [ ] Integration tests for booking flow
- [ ] Integration tests for waitlist flow
- [ ] Integration tests for resale flow
- [ ] E2E tests for critical paths
- [ ] Performance tests
- [ ] Security tests

---

## Optional Enhancements

### Mobile Wallet Integration
- [ ] Apple Wallet support (PKPass format)
- [ ] Google Pay support
- [ ] Samsung Pay support

### Advanced Features
- [ ] Group booking discounts
- [ ] Corporate/bulk booking
- [ ] Subscription/season passes
- [ ] VIP packages with perks
- [ ] Merchandise bundling
- [ ] Parking slot booking
- [ ] Hotel recommendations

### Analytics & Reporting
- [ ] Customer lifetime value
- [ ] Churn analysis
- [ ] Predictive analytics (demand forecasting)
- [ ] Fraud detection ML model
- [ ] Recommendation engine

### Integrations
- [ ] Stripe/Razorpay payment gateway
- [ ] SendGrid/Twilio for notifications
- [ ] Google Maps for venue location
- [ ] Social media sharing
- [ ] Calendar integration (Google, Outlook)

---

## Success Criteria

✅ All Phase 1 tasks completed
✅ All Phase 2 tasks completed
✅ All Phase 3 tasks completed
✅ Zero double-bookings (atomic locking verified)
✅ Ticket purchase time: <2 seconds
✅ Availability update: <1 second
✅ Waitlist conversion: >80% within 24h
✅ Resale adoption: >20% of sold tickets
✅ Load test: 1000 concurrent users, <100ms p95
✅ >95% uptime during peak hours
✅ All tests passing (unit, integration, E2E)
✅ Security audit passed
✅ Documentation complete
