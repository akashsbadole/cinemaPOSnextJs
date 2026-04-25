import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/venues/[id]/sections - List sections for a venue
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verify venue exists
    const venue = await db.venue.findUnique({ where: { id } })
    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })

    const sections = await db.venueSection.findMany({
      where: { venueId: id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ sections })
  } catch (e: any) {
    console.error('GET /api/venues/[id]/sections error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/venues/[id]/sections - Add a new section to venue
export async function POST(
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
    const { name, capacity, coordX, coordY } = body

    if (!name || !capacity) {
      return NextResponse.json({ error: 'Name and capacity are required' }, { status: 400 })
    }

    // Verify venue exists
    const venue = await db.venue.findUnique({ where: { id } })
    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })

    const section = await db.venueSection.create({
      data: {
        venueId: id,
        name,
        capacity: capacity,
        coordX: coordX ?? null,
        coordY: coordY ?? null,
      },
    })

    return NextResponse.json({ section }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/venues/[id]/sections error:', e)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
