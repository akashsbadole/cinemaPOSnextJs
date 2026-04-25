import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { lockTickets, unlockTickets, getTicketAvailability } from '@/lib/ticket-lock'
import { sendEventBookingConfirmation } from '@/lib/notifications'
import { generateTicketQR, generateBarcodeSVG, generateTicketPDF } from '@/lib/ticket'
import { calculateDynamicPrice } from '@/lib/pricing-engine'
import { isRateLimited } from '@/lib/rate-limiter'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import { format } from 'date-fns'

const generateTicketNumber = (eventId: string, seq: number): string => {
  const eventShort = eventId.slice(-6)
  return `T${eventShort}-${seq.toString().padStart(4, '0')}`
}

// POST /api/tickets/purchase
export async function POST(req: Request) {
  const user = await getSession() // optional, guest allowed?

  // Rate limiting: 5 requests per minute per identifier
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown')
  const identifier = user ? `user:${user.id}` : `ip:${ip}`
  if (isRateLimited(identifier, 5, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests, please try again later' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { eventId, tierId, quantity, customerName, customerEmail, customerPhone, paymentMethod, couponCode, sessionId } = body

    // Validate input
    if (!eventId || !tierId || !quantity || quantity < 1 || quantity > 10) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Customer name and phone required' }, { status: 400 })
    }

    // Fetch event and tier with venue
    const tier = await db.ticketTier.findUnique({
      where: { id: tierId },
      include: { event: { include: { venue: true } } },
    })
    if (!tier) return NextResponse.json({ error: 'Ticket tier not found' }, { status: 404 })

    // Ensure tier belongs to event
    if (tier.eventId !== eventId) return NextResponse.json({ error: 'Tier does not belong to event' }, { status: 400 })

    // Check event status
    const event = tier.event
    if (!['PUBLISHED', 'LIVE'].includes(event.status)) {
      return NextResponse.json({ error: 'Event is not open for booking' }, { status: 400 })
    }

    // Check tier availability window
    const now = new Date()
    if (tier.availableFrom && now < tier.availableFrom) {
      return NextResponse.json({ error: 'Tier not yet available' }, { status: 400 })
    }
    if (tier.availableUntil && now > tier.availableUntil) {
      return NextResponse.json({ error: 'Tier no longer available' }, { status: 400 })
    }

    // Acquire a session identifier if not provided (for stateless)
    const lockSessionId = sessionId || crypto.randomUUID()

    // Lock tickets
    const lockResult = await lockTickets(eventId, tierId, quantity, lockSessionId)
    if (!lockResult.success) {
      return NextResponse.json({
        error: 'Insufficient tickets available',
        available: lockResult.conflict,
      }, { status: 409 })
    }

    // Calculate dynamic price using pricing engine
    let pricePerTicket: number
    try {
      pricePerTicket = await calculateDynamicPrice(tierId)
    } catch (err) {
      console.error('Pricing engine error, using base', err)
      pricePerTicket = tier.basePrice
    }
    const totalAmount = pricePerTicket * quantity

    // Coupon handling (reuse from existing logic)
    let discountAmount = 0
    if (couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: couponCode,
          active: true,
          validFrom: { lte: new Date() },
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } },
          ],
        },
      })
      if (coupon) {
        const withinUsageLimit = coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit
        if (withinUsageLimit && totalAmount >= coupon.minAmount) {
          if (coupon.type === 'PERCENT') {
            discountAmount = Math.min(totalAmount * (coupon.value / 100), coupon.maxDiscount || Infinity)
          } else {
            discountAmount = coupon.value
          }
          await db.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } })
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount)
    const bookingRef = `BK${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(Math.random() * 9000 + 1000)}`

    // Create booking and related records in a transaction
    const booking = await db.$transaction(async (tx) => {
      // Create booking
      const b = await tx.booking.create({
        data: {
          bookingRef,
          userId: user?.id ?? null,
          eventId,
          showId: null, // no show
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          status: 'CONFIRMED',
          totalAmount,
          discountAmount,
          finalAmount,
          channel: 'ONLINE',
        },
        include: { event: true },
      })

      // Create tickets
      const tickets = []
      for (let i = 0; i < quantity; i++) {
        const ticketId = uuidv4()
        const ticketNumber = generateTicketNumber(eventId, i + 1)
        // QR data: JSON with ticketId and bookingRef
        const qrData = JSON.stringify({ ticketId, bookingRef, eventId, ts: Date.now() })
        const qrCodeUrl = await generateTicketQR(qrData) // we'll need to adjust generateTicketQR to accept arbitrary string
        const barcodeSvg = generateBarcodeSVG(ticketNumber) // same for all? maybe use ticketNumber
        const barcodeDataUrl = barcodeSvg // returns data URL

        const ticket = await tx.ticket.create({
          data: {
            id: ticketId,
            bookingId: b.id,
            eventId,
            ticketTierId: tierId,
            ticketNumber,
            qrCode: qrCodeUrl,
            barcode: barcodeDataUrl,
            status: 'ACTIVE',
            customerName,
            customerEmail: customerEmail || '',
            customerPhone,
            originalPrice: pricePerTicket,
          },
        })
        tickets.push(ticket)
      }

      // Update tier sold count, available count, and current price (dynamic)
      await tx.ticketTier.update({
        where: { id: tierId },
        data: {
          soldCount: { increment: quantity },
          availableCount: { decrement: quantity },
          currentPrice: pricePerTicket,
        },
      })

      // Create payment
      await tx.payment.create({
        data: {
          bookingId: b.id,
          method: paymentMethod || 'ONLINE',
          amount: finalAmount,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      })

      // Release ticket locks (since purchase, we remove locks)
      await tx.ticketLock.deleteMany({
        where: { eventId, ticketTierId: tierId, sessionId: lockSessionId },
      })

       // Return booking with tickets and related data
       return tx.booking.findUnique({
         where: { id: b.id },
         include: {
           event: { include: { venue: true } },
           tickets: true,
           payment: true,
         },
       })
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking creation failed' }, { status: 500 })
    }

    // Send confirmation notification (async)
    try {
      const ticketNumbers = booking.tickets.map((t: any) => t.ticketNumber)
      // Prepare event date string
      const eventDateStr = format(new Date(event.startDate), 'dd MMM yyyy, hh:mm a')
      // Optionally generate a combined PDF with all tickets (skip for now)
      sendEventBookingConfirmation({
        bookingRef: booking.bookingRef,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        eventTitle: event.title,
        eventDate: eventDateStr,
        venueName: event.venue.name,
        tierName: tier.name,
        quantity,
        ticketNumbers,
        totalAmount: finalAmount,
        // ticketPdf could be generated later
      }).catch(console.error)
    } catch (notifErr) {
      console.error('Notification error:', notifErr)
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/tickets/purchase error:', e)
    // Unlock if transaction fails
    if (e.message !== 'Insufficient tickets available') {
      // Might need to release locks; but transaction should have cleaned up
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
