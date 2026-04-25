import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/my-tickets - Get current user's tickets
export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get bookings for the user with tickets and event details
    const bookings = await db.booking.findMany({
      where: { userId: user.id },
      include: {
        event: {
          include: {
            venue: true,
          },
        },
        tickets: {
          include: {
            ticketTier: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format response
    const result = bookings.map(b => ({
      bookingRef: b.bookingRef,
      status: b.status,
      totalAmount: b.finalAmount,
      event: b.event ? {
        id: b.event.id,
        title: b.event.title,
        startDate: b.event.startDate,
        endDate: b.event.endDate,
        venue: b.event.venue?.name || '',
      } : null,
      tickets: b.tickets.map(t => ({
        ticketNumber: t.ticketNumber,
        qrCode: t.qrCode,
        barcode: t.barcode,
        status: t.status,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        ticketTier: t.ticketTier?.name,
      })),
      payment: b.payment ? {
        method: b.payment.method,
        status: b.payment.status,
        paidAt: b.payment.paidAt,
      } : null,
    }))

    return NextResponse.json({ bookings: result })
  } catch (e: any) {
    console.error('GET /api/my-tickets error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
