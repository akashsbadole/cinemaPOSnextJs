import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createTicketTierSchema, updateTicketTierSchema } from '@/lib/validators/tier'
import { getTicketAvailability } from '@/lib/ticket-lock'

// GET /api/events/[id]/tiers - List ticket tiers for event
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verify event exists
    const event = await db.event.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Get real-time availability via ticket-lock helper
    const { tiers } = await getTicketAvailability(id)
    // Include tier details (name, section, basePrice, etc)
    const tierDetails = await db.ticketTier.findMany({
      where: { eventId: id },
      include: {
        section: true,
        features: true,
      },
    })

    // Merge availability with tier static data
    const tiersWithAvailability = tierDetails.map(t => {
      const avail = tiers.find(a => a.tierId === t.id) || { availableCount: 0, lockedCount: 0, soldCount: t.soldCount, currentPrice: t.currentPrice }
      return {
        id: t.id,
        name: t.name,
        basePrice: t.basePrice,
        currentPrice: avail.currentPrice,
        totalCapacity: t.totalCapacity,
        soldCount: t.soldCount,
        lockedCount: avail.lockedCount,
        availableCount: avail.availableCount,
        section: t.section,
        features: t.features,
      }
    })

    return NextResponse.json({ tiers: tiersWithAvailability })
  } catch (e: any) {
    console.error('GET /api/events/[id]/tiers error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/events/[id]/tiers - Create a new ticket tier
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: eventId } = await params
    const body = await req.json()
    const data = createTicketTierSchema.parse(body)

    // Verify event exists and user is organizer/admin
    const event = await db.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.organizerId !== user.id && !['SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Only event organizer can create tiers' }, { status: 403 })
    }

    // If sectionId provided, verify section belongs to event's venue
    if (data.sectionId) {
      const venue = await db.venue.findUnique({ where: { id: event.venueId } })
      const section = await db.venueSection.findFirst({
        where: { id: data.sectionId, venueId: venue?.id },
      })
      if (!section) return NextResponse.json({ error: 'Invalid section for this venue' }, { status: 400 })
    }

    // Create tier with features
    const tier = await db.ticketTier.create({
      data: {
        eventId,
        sectionId: data.sectionId || null,
        name: data.name,
        basePrice: data.basePrice,
        currentPrice: data.basePrice, // initially no surge
        totalCapacity: data.totalCapacity,
        availableCount: data.totalCapacity,
        availableFrom: data.availableFrom ? new Date(data.availableFrom) : null,
        availableUntil: data.availableUntil ? new Date(data.availableUntil) : null,
        features: { create: data.features.map((name: string) => ({ name })) },
      },
      include: { section: true, features: true },
    })

    return NextResponse.json({ tier }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/events/[id]/tiers error:', e)
    if (e.errors) {
      return NextResponse.json({ error: 'Validation failed', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
