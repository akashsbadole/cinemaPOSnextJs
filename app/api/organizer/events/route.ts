import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/organizer/events - List events for current organizer
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ORGANIZER', 'SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const events = await db.event.findMany({
    where: { organizerId: user.id },
    include: {
      venue: { select: { id: true, name: true, city: true } },
      _count: { select: { bookings: true } },
      ticketTiers: { select: { id: true, name: true, basePrice: true, currentPrice: true, soldCount: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json({ events })
}
