import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createVenueSchema, updateVenueSchema } from '@/lib/validators/venue'

// GET /api/venues - List all venues
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const country = searchParams.get('country')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
        { address: { contains: search } },
      ]
    }
    if (city) where.city = city
    if (state) where.state = state
    if (country) where.country = country

    const venues = await db.venue.findMany({
      where,
      include: {
        sections: true,
        _count: { select: { events: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ venues, total: venues.length })
  } catch (e: any) {
    console.error('GET /api/venues error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/venues - Create venue (admin only)
export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['SUPER_ADMIN', 'THEATER_OWNER', 'MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: Requires admin/manager role' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createVenueSchema.parse(body)

    const venue = await db.venue.create({
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

    return NextResponse.json({ venue }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/venues error:', e)
    if (e.errors) {
      return NextResponse.json({ error: 'Validation failed', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
