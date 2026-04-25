import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/events/[id]/availability - Real-time ticket tier availability
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verify event exists
    const event = await db.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Clean expired locks first
    const now = new Date()
    await db.ticketLock.deleteMany({ where: { expiresAt: { lt: now } } })

    // Get all tiers for event
    const tiers = await db.ticketTier.findMany({
      where: { eventId: id },
      include: {
        ticketLocks: {
          where: { expiresAt: { gt: now } },
        },
        _count: { select: { tickets: true } },
      },
    })

    // Compute availability per tier
    const availability = tiers.map(t => {
      const lockedCount = t.ticketLocks.reduce((sum, lock) => sum + lock.quantity, 0)
      const soldCount = t._count.tickets
      const available = Math.max(0, t.totalCapacity - soldCount - lockedCount)
      return {
        tierId: t.id,
        tierName: t.name,
        totalCapacity: t.totalCapacity,
        sold: soldCount,
        locked: lockedCount,
        available,
        currentPrice: t.currentPrice,
        isAvailable: available > 0,
      }
    })

    return NextResponse.json({ eventId: id, tiers: availability })
  } catch (e: any) {
    console.error('GET /api/events/[id]/availability error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
