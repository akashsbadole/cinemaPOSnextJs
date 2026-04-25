import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateVenueSchema } from '@/lib/validators/venue'

// GET /api/venues/[id] - Get venue details with sections
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const venue = await db.venue.findUnique({
      where: { id },
      include: {
        sections: true,
        events: {
          include: {
            ticketTiers: true,
            _count: { select: { bookings: true } },
          },
          orderBy: { startDate: 'desc' },
          take: 10, // recent events
        },
      },
    })

    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })

    return NextResponse.json({ venue })
  } catch (e: any) {
    console.error('GET /api/venues/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PUT /api/venues/[id] - Update venue (admin only)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['SUPER_ADMIN', 'THEATER_OWNER', 'MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: Requires admin/manager role' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const data = updateVenueSchema.parse(body)

    const existing = await db.venue.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })

    const updated = await db.venue.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        capacity: data.capacity,
      },
    })

    return NextResponse.json({ venue: updated })
  } catch (e: any) {
    console.error('PUT /api/venues/[id] error:', e)
    if (e.errors) {
      return NextResponse.json({ error: 'Validation failed', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

// DELETE /api/venues/[id] - Delete venue (admin only) - soft delete? We'll hard delete with caution
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: Requires super admin' }, { status: 403 })
  }

  try {
    const { id } = await params
    // Check if venue has associated events
    const eventCount = await db.event.count({ where: { venueId: id } })
    if (eventCount > 0) {
      return NextResponse.json({ error: 'Cannot delete venue with associated events' }, { status: 400 })
    }

    await db.venue.delete({ where: { id } })
    return NextResponse.json({ message: 'Venue deleted' })
  } catch (e: any) {
    console.error('DELETE /api/venues/[id] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
