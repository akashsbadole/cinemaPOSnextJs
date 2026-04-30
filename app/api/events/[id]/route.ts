import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateEventSchema } from '@/lib/validators/event'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await db.event.findUnique({
      where: { id },
      include: {
        venue: true,
        organizer: { select: { id: true, name: true, email: true } },
        ticketTiers: { include: { section: true } },
        reviews: { include: { customer: { select: { id: true, name: true } } } },
        _count: { select: { bookings: true } },
      },
    })

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    return NextResponse.json({ event })
  } catch (e: any) {
    console.error('GET /api/events/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const data = updateEventSchema.parse(body)

    // Fetch existing event
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Only organizer or admin can update
    if (existing.organizerId !== user.id && !['SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own events' }, { status: 403 })
    }

    // Update event
    const updated = await db.event.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        eventType: data.eventType,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        venueId: data.venueId,
        posterUrl: data.posterUrl ?? undefined,
        bannerUrl: data.bannerUrl ?? undefined,
        trailerUrl: data.trailerUrl ?? undefined,
        capacity: data.capacity,
        refundPolicy: data.refundPolicy,
        status: data.status,
      },
      include: {
        venue: true,
        organizer: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ event: updated })
  } catch (e: any) {
    console.error('PUT /api/events/[id] error:', e)
    if (e.errors) {
      return NextResponse.json({ error: 'Validation failed', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const existing = await db.event.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    if (existing.organizerId !== user.id && !['SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: You can only cancel your own events' }, { status: 403 })
    }

    // Cancel event (set status to CANCELLED) rather than hard delete
    await db.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ message: 'Event cancelled' })
  } catch (e: any) {
    console.error('DELETE /api/events/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
