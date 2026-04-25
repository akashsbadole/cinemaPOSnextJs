import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTicketAvailability } from '@/lib/ticket-lock'

// GET /api/tiers/[id]/availability - Get real-time availability for a tier
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verify tier exists
    const tier = await db.ticketTier.findUnique({
      where: { id },
      include: { event: true },
    })
    if (!tier) return NextResponse.json({ error: 'Ticket tier not found' }, { status: 404 })

    const { tiers } = await getTicketAvailability(tier.eventId)
    const avail = tiers.find(t => t.tierId === id)
    if (!avail) {
      return NextResponse.json({ error: 'Availability data not found' }, { status: 404 })
    }

    return NextResponse.json(avail)
  } catch (e: any) {
    console.error('GET /api/tiers/[id]/availability error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
