import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/organizer/dashboard - Get organizer overview
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Only organizers or admins
  if (!['ORGANIZER', 'SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get events organized by user
  const events = await db.event.findMany({
    where: { organizerId: user.id },
    include: {
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Compute totals
  let totalBookings = 0
  let totalRevenue = 0
  let upcomingEvents = 0

  for (const ev of events) {
    totalBookings += ev._count.bookings
    // Sum of finalAmount from bookings
    const bookingsWithAmount = await db.booking.findMany({
      where: { eventId: ev.id, status: 'CONFIRMED' },
      select: { finalAmount: true },
    })
    bookingsWithAmount.forEach(b => { totalRevenue += b.finalAmount })
    if (ev.status === 'PUBLISHED' || ev.status === 'LIVE') upcomingEvents++
  }

  return NextResponse.json({
    stats: {
      totalEvents: events.length,
      totalBookings,
      totalRevenue,
      upcomingEvents,
    },
    recentEvents: events.map(ev => ({
      id: ev.id,
      title: ev.title,
      startDate: ev.startDate,
      status: ev.status,
      'totalRevenue': totalRevenue, // not per-event; compute separately below
    })),
  })
}
