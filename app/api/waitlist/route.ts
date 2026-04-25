import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { addToWaitlist } from '@/lib/waitlist-queue'

// POST /api/waitlist - Join waitlist
export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { eventId, ticketTierId, quantity } = body

    if (!eventId || !ticketTierId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await addToWaitlist(eventId, user.id, ticketTierId, quantity)
    return NextResponse.json({ waitlist: result }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// GET /api/waitlist - List current user's waitlist entries
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await db.waitlist.findMany({
    where: { customerId: user.id },
    include: {
      event: { select: { id: true, title: true, startDate: true, venue: true } },
      ticketTier: { select: { id: true, name: true } },
    },
    orderBy: { priority: 'asc' },
  })

  return NextResponse.json({ entries })
}
