// app/api/bookings/[id]/ticket/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateTicketHTML, generateTicketPDF, generateThermalTicket, TicketData } from '@/lib/ticket'
import { format } from 'date-fns'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const formatType = searchParams.get('format') || 'html'

    const booking = await db.booking.findFirst({
      where: { OR: [{ id }, { bookingRef: id }] },
      include: {
        show: { include: { movie: true, screen: { include: { theater: true } } } },
        bookingSeats: { include: { seat: true } },
        bookingItems: { include: { foodItem: true } },
      },
    })
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const seats = booking.bookingSeats.map((bs: any) => `${bs.seat.row}${bs.seat.number}`)
    const foodItems = booking.bookingItems?.map((bi: any) => ({
      name: bi.foodItem.name,
      quantity: bi.quantity,
      price: bi.price,
    })) || []
    const foodTotal = foodItems.reduce((sum: number, fi: any) => sum + fi.price * fi.quantity, 0)
    const ticketData: TicketData = {
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
      foodItems: foodItems.length > 0 ? foodItems : undefined,
      foodTotal: foodTotal > 0 ? foodTotal : undefined,
    }

    if (formatType === 'pdf') {
      const pdfBuffer = await generateTicketPDF(ticketData)
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ticket-${booking.bookingRef}.pdf"`,
        },
      })
    }

    if (formatType === 'thermal') {
      const thermal = generateThermalTicket(ticketData)
      return new NextResponse(thermal, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="ticket-${booking.bookingRef}.txt"`,
        },
      })
    }

    const html = await generateTicketHTML(ticketData)
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