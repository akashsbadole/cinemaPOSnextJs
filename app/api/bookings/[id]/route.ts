// app/api/bookings/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const booking = await db.booking.findFirst({
      where: {
        OR: [{ id }, { bookingRef: id }],
      },
      include: {
        show: { include: { movie: true, screen: { include: { theater: true } } } },
        bookingSeats: { include: { seat: true } },
        bookingItems: { include: { foodItem: true } },
        payment: true,
        cancellation: true,
      },
    })
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    return NextResponse.json({ booking })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
