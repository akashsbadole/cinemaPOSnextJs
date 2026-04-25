import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { lockTickets } from '@/lib/ticket-lock'
import { sendEventBookingConfirmation } from '@/lib/notifications'
import { generateTicketQR, generateBarcodeSVG } from '@/lib/ticket'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const generateTicketNumber = (eventId: string, seq: number): string => {
  const eventShort = eventId.slice(-6)
  return `T${eventShort}-${seq.toString().padStart(4, '0')}`
}

// POST /api/waitlist/[id]/convert - Convert waitlist entry to booking
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { paymentMethod, customerName, customerEmail, customerPhone } = body

    // Find waitlist entry
    const entry = await db.waitlist.findUnique({
      where: { id },
      include: { event: true, ticketTier: true },
    })
    if (!entry) return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 })
    if (entry.customerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (entry.status !== 'NOTIFIED') return NextResponse.json({ error: 'Waitlist entry is not in NOTIFIED status' }, { status: 400 })
    if (entry.expiresAt < new Date()) {
      await db.waitlist.update({ where: { id }, data: { status: 'EXPIRED' } })
      return NextResponse.json({ error: 'Notification period expired' }, { status: 400 })
    }

    const { eventId, ticketTierId, quantity } = entry

    // Acquire lock (using special session)
    const lockSessionId = `waitlist-convert-${id}`
    const { lockTickets } = await import('@/lib/ticket-lock')
    const lockResult = await lockTickets(eventId, ticketTierId, quantity, lockSessionId)
    if (!lockResult.success) {
      return NextResponse.json({ error: 'Tickets no longer available' }, { status: 409 })
    }

    // Re-fetch tier with event
    const tier = await db.ticketTier.findUnique({
      where: { id: ticketTierId },
      include: { event: { include: { venue: true } } },
    })
    if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 })

    // Calculate price
    const { calculateDynamicPrice } = await import('@/lib/pricing-engine')
    let pricePerTicket
    try {
      pricePerTicket = await calculateDynamicPrice(tierId)
    } catch {
      pricePerTicket = tier.basePrice
    }
    const totalAmount = pricePerTicket * quantity

    // Create booking and tickets in transaction
    const bookingRef = `BK${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(Math.random() * 9000 + 1000)}`

    const booking = await db.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingRef,
          userId: user.id,
          eventId,
          showId: null,
          customerName: customerName || user.name,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          status: 'CONFIRMED',
          totalAmount,
          discountAmount: 0,
          finalAmount: totalAmount,
          channel: 'ONLINE',
        },
        include: { event: true },
      })

      // Create tickets
      for (let i = 0; i < quantity; i++) {
        const ticketId = uuidv4()
        const ticketNumber = generateTicketNumber(eventId, i + 1)
        const qrData = JSON.stringify({ ticketId, bookingRef, eventId, ts: Date.now() })
        const qrCode = await generateTicketQR(qrData)
        const barcode = generateBarcodeSVG(ticketNumber)

        await tx.ticket.create({
          data: {
            id: ticketId,
            bookingId: b.id,
            eventId,
            ticketTierId,
            ticketNumber,
            qrCode,
            barcode,
            status: 'ACTIVE',
            customerName: customerName || user.name,
            customerEmail: customerEmail || '',
            customerPhone: customerPhone || '',
            originalPrice: pricePerTicket,
          },
        })
      }

      // Update tier sold/available
      await tx.ticketTier.update({
        where: { id: ticketTierId },
        data: { soldCount: { increment: quantity }, availableCount: { decrement: quantity } },
      })

      // Release waitlist lock
      await tx.waitlist.update({
        where: { id },
        data: { status: 'CONVERTED', convertedAt: new Date() },
      })

      // Remove ticket locks
      await tx.ticketLock.deleteMany({
        where: { eventId, ticketTierId, sessionId: lockSessionId },
      })

      return tx.booking.findUnique({
        where: { id: b.id },
        include: { event: { include: { venue: true } }, tickets: true, payment: true },
      })
    })

    if (!booking) throw new Error('Booking creation failed')

    // Send confirmation
    try {
      const ticketNumbers = booking.tickets.map((t: any) => t.ticketNumber)
      const eventDateStr = new Date(entry.event.startDate).toLocaleString('en-IN')
      sendEventBookingConfirmation({
        bookingRef: booking.bookingRef,
        customerName: booking.customerName || user.name,
        customerPhone: booking.customerPhone || '',
        customerEmail: booking.customerEmail,
        eventTitle: entry.event.title,
        eventDate: eventDateStr,
        venueName: entry.event.venue.name,
        tierName: entry.ticketTier.name,
        quantity,
        ticketNumbers,
        totalAmount,
      }).catch(console.error)
    } catch (notifErr) {
      console.error('Notification error:', notifErr)
    }

    return NextResponse.json({ booking }, { status: 200 })
  } catch (e: any) {
    console.error('Convert waitlist error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
