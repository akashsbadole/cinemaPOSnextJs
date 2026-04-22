// app/api/ticket/verify/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { bookingRef } = await req.json()
    if (!bookingRef) {
      return NextResponse.json({ valid: false, error: 'No booking reference provided' }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { bookingRef },
      include: {
        show: { include: { movie: true, screen: { include: { theater: true } } } },
        bookingSeats: { include: { seat: true } },
        user: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ valid: false, error: 'Ticket not found' }, { status: 404 })
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return NextResponse.json({ 
        valid: false, 
        error: `Ticket already ${booking.status.toLowerCase()}` 
      }, { status: 400 })
    }

    if (booking.status === 'PENDING') {
      return NextResponse.json({ 
        valid: false, 
        error: 'Ticket payment not completed' 
      }, { status: 400 })
    }

    const now = new Date()
    const showStart = new Date(booking.show.startTime)
    const showEnd = new Date(booking.show.endTime)

    if (now > showEnd) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Show has already ended' 
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      ticket: {
        bookingRef: booking.bookingRef,
        movieTitle: booking.show.movie.title,
        showDate: showStart.toLocaleDateString('en-IN'),
        showTime: showStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        screen: booking.show.screen.name,
        theater: booking.show.screen.theater.name,
        seats: booking.bookingSeats.map((bs: any) => `${bs.seat.row}${bs.seat.number}`),
        customerName: booking.customerName || booking.user?.name || 'N/A',
        totalAmount: booking.finalAmount,
        format: booking.show.movie.format,
        status: booking.status,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 500 })
  }
}