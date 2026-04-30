import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateTicketTierSchema } from '@/lib/validators/tier'

// PUT /api/tiers/[id] - Update ticket tier
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const data = updateTicketTierSchema.parse(body)

    // Find tier with event
    const tier = await db.ticketTier.findUnique({
      where: { id },
      include: { event: true },
    })
    if (!tier) return NextResponse.json({ error: 'Ticket tier not found' }, { status: 404 })

    // Check permission (organizer of the event or admin)
    if (tier.event.organizerId !== user.id && !['SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Only event organizer can update tiers' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.basePrice !== undefined) {
      updateData.basePrice = data.basePrice
    }
    if (data.currentPrice !== undefined) updateData.currentPrice = data.currentPrice
    if (data.totalCapacity !== undefined) {
      updateData.totalCapacity = data.totalCapacity
    }
    if (data.availableCount !== undefined) updateData.availableCount = data.availableCount
    if (data.availableFrom !== undefined) updateData.availableFrom = data.availableFrom ? new Date(data.availableFrom) : null
    if (data.availableUntil !== undefined) updateData.availableUntil = data.availableUntil ? new Date(data.availableUntil) : null

    // Update basic fields first
    const updated = await db.ticketTier.update({
      where: { id },
      data: updateData,
      include: { section: true },
    })

    // Handle features separately if provided
    if (data.features !== undefined) {
      // Delete existing
      await db.tierFeature.deleteMany({ where: { tierId: id } })
      // Create new features
      if (data.features.length > 0) {
        await db.tierFeature.createMany({
          data: data.features.map((name: string) => ({ name, tierId: id })),
        })
      }
      // Re-fetch to include new features
      const updatedWithFeatures = await db.ticketTier.findUnique({
        where: { id },
        include: { section: true, features: true },
      })
      return NextResponse.json({ tier: updatedWithFeatures })
    }

    return NextResponse.json({ tier: updated })
  } catch (e: any) {
    console.error('PUT /api/tiers/[id] error:', e)
    if (e.errors) {
      return NextResponse.json({ error: 'Validation failed', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
