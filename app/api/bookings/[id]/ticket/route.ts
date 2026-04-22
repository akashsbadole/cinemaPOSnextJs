// app/api/bookings/[id]/ticket/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateTicketHTML } from '@/lib/ticket'
import { format } from 'date-fns'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const booking = await db.booking.findFirst({
      where: { OR: [{ id: params.id }, { bookingRef: params.id }] },
      include: {
        show: { include: { movie: true, screen: { include: { theater: true } } } },
        bookingSeats: { include: { seat: true } },
      },
    })
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const seats = booking.bookingSeats.map(bs => `${bs.seat.row}${bs.seat.number}`)

    const html = await generateTicketHTML({
      bookingRef: booking.bookingRef,
      movieTitle: booking.show.movie.title,
      showDate: format(new Date(booking.show.startTime), 'dd MMM yyyy'),
      showTime: format(new Date(booking.show.startTime), 'hh:mm a'),
      screen: booking.show.screen.name,
      theater: booking.show.screen.theater.name,
      seats,
      customerName: booking.customerName || 'Guest',
      totalAmount: booking.finalAmount,
      format: booking.show.movie.format,
    })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="ticket-${booking.bookingRef}.html"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
