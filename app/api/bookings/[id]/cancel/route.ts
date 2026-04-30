// app/api/bookings/[id]/cancel/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { sendCancellationAlert } from '@/lib/notifications'
import { z } from 'zod'

const schema = z.object({
  reason: z.string().optional(),
  refundMethod: z.enum(['WALLET', 'ORIGINAL', 'CASH']).default('WALLET'),
  cancellationProtect: z.boolean().default(false),
})

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const resolvedParams = await context.params
  const id = resolvedParams.id
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { reason, refundMethod, cancellationProtect } = schema.parse(body)

    const booking = await db.booking.findFirst({
      where: { OR: [{ id: id }, { bookingRef: id }] },
      include: {
        show: { include: { movie: true } },
        event: true,
        payment: true
      },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    if (booking.status === 'REFUNDED') return NextResponse.json({ error: 'Already refunded' }, { status: 400 })

    // Update booking with cancellation protect if requested
    if (cancellationProtect && !booking.cancellationProtect) {
      await db.booking.update({
        where: { id: booking.id },
        data: { cancellationProtect: true, finalAmount: booking.finalAmount * 1.1 },
      })
      booking.finalAmount = booking.finalAmount * 1.1
      booking.cancellationProtect = true
    }

    // Determine event/movie start time
    const now = new Date()
    let minutesUntilEvent = 0
    let eventTitle = ''
    let eventDate: Date | null = null

    if (booking.show) {
      const showStart = new Date(booking.show.startTime)
      minutesUntilEvent = (showStart.getTime() - now.getTime()) / (1000 * 60)
      eventTitle = booking.show.movie.title
      eventDate = showStart
    } else if (booking.event) {
      const eventStart = new Date(booking.event.startDate)
      minutesUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60)
      eventTitle = booking.event.title
      eventDate = eventStart
    }

    let refundAmount = 0
    let refundStatus: 'APPROVED' | 'REJECTED' = 'REJECTED'

    // Cancellation Protect gives flexible cancellation
    if (booking.cancellationProtect || cancellationProtect) {
      if (minutesUntilEvent > 120) { // More than 2 hours before
        refundAmount = booking.finalAmount * 0.9 // 10% fee
        refundStatus = 'APPROVED'
      } else if (minutesUntilEvent > 0) { // Up to event time
        refundAmount = booking.finalAmount * 0.8 // 20% fee
        refundStatus = 'APPROVED'
      }
    } else {
      // Standard cancellation policy
      if (minutesUntilEvent > 1440) { // More than 24 hours
        refundAmount = booking.finalAmount
        refundStatus = 'APPROVED'
      } else if (minutesUntilEvent > 360) { // More than 6 hours
        refundAmount = booking.finalAmount * 0.8
        refundStatus = 'APPROVED'
      } else if (minutesUntilEvent > 120) { // More than 2 hours
        refundAmount = booking.finalAmount * 0.5
        refundStatus = 'APPROVED'
      }
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: refundAmount > 0 ? 'REFUNDED' : 'CANCELLED' },
      })

      await tx.cancellation.create({
        data: {
          bookingId: booking.id,
          reason,
          refundAmount,
          refundMethod,
          status: refundStatus,
        },
      })

      if (booking.payment && refundAmount > 0) {
        await tx.payment.update({
          where: { bookingId: booking.id },
          data: { status: 'REFUNDED' },
        })
      }

      return updated
    })

    // Send cancellation notification
    const bookingWithDetails = await db.booking.findUnique({
      where: { id: booking.id },
      include: {
        show: { include: { movie: true, screen: true } },
        event: true,
        bookingSeats: { include: { seat: true } },
        tickets: true
      },
    })

    if (bookingWithDetails) {
      let eventTitle = ''
      let eventDate = ''
      let eventTime = ''
      let venueInfo = ''

      if (bookingWithDetails.show) {
        const showStart = new Date(bookingWithDetails.show.startTime)
        eventTitle = bookingWithDetails.show.movie.title
        eventDate = showStart.toLocaleDateString('en-IN')
        eventTime = showStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        venueInfo = bookingWithDetails.show.screen.name
      } else if (bookingWithDetails.event) {
        const eventStart = new Date(bookingWithDetails.event.startDate)
        eventTitle = bookingWithDetails.event.title
        eventDate = eventStart.toLocaleDateString('en-IN')
        eventTime = eventStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        venueInfo = bookingWithDetails.event.venue?.name || ''
      }

      sendCancellationAlert({
        bookingRef: bookingWithDetails.bookingRef,
        customerName: bookingWithDetails.customerName || '',
        customerPhone: bookingWithDetails.customerPhone || '',
        customerEmail: bookingWithDetails.customerEmail || undefined,
        movieTitle: eventTitle,
        showDate: eventDate,
        showTime: eventTime,
        screen: venueInfo,
        seats: bookingWithDetails.bookingSeats?.map(bs => `${bs.seat.row}${bs.seat.number}`) || [],
        totalAmount: bookingWithDetails.finalAmount,
        refundAmount,
      }).catch(console.error)
    }

    return NextResponse.json({ booking: result, refundAmount, refundStatus })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
