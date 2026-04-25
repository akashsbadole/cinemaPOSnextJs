import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eventFilterSchema, createEventSchema, updateEventSchema } from '@/lib/validators/event'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse filters
    const filters = {
      category: searchParams.get('category'),
      eventType: searchParams.get('eventType'),
      status: searchParams.get('status') || 'PUBLISHED',
      venueId: searchParams.get('venueId'),
      startAfter: searchParams.get('startAfter'),
      startBefore: searchParams.get('startBefore'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      search: searchParams.get('search'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    }

    // Validate filters
    const parseResult = eventFilterSchema.safeParse(filters)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid filters', details: parseResult.error.flatten() }, { status: 400 })
    }

    const { category, eventType, status, venueId, startAfter, startBefore, minPrice, maxPrice, search, page, limit } = parseResult.data

    // Build query
    const where: any = {}

    if (category) where.category = category
    if (eventType) where.eventType = eventType
    if (status) where.status = status
    if (venueId) where.venueId = venueId
    if (startAfter) where.startDate = { gte: new Date(startAfter) }
    if (startBefore) where.startDate = { lte: new Date(startBefore) }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Pagination values
    const pageNum = Math.max(1, parseInt(page))
    const limitVal = Math.min(100, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitVal

    // Fetch events with pagination
    const events = await db.event.findMany({
      where,
      include: {
        venue: true,
        organizer: { select: { id: true, name: true, email: true } },
        ticketTiers: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { startDate: 'asc' },
      skip,
      take: limitVal,
    })

    // Filter by price range if provided (client-side)
    let filteredEvents = events
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0
      const max = maxPrice ? parseFloat(maxPrice) : Infinity
      filteredEvents = events.filter(ev => {
        return ev.ticketTiers.some(t => {
          const p = t.currentPrice
          return p >= min && p <= max
        })
      })
    }

    // Get total count for pagination (approximate if price filtered; we can't easily get count after price filter)
    // So we use count with base filters
    const total = await db.event.count({ where })

    return NextResponse.json({ events: filteredEvents, total, page: pageNum, limit: limitVal, pages: Math.ceil(total / limitVal) })
  } catch (e: any) {
    console.error('GET /api/events error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Only allow organizers (or admin/super admin) to create events
  if (!['ORGANIZER', 'SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: Requires organizer role' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createEventSchema.parse(body)

    // Validate venue exists
    const venue = await db.venue.findUnique({ where: { id: data.venueId } })
    if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })

     // Create event
     const event = await db.event.create({
       data: {
         title: data.title,
         description: data.description || '',
         category: data.category,
         eventType: data.eventType,
         startDate: new Date(data.startDate),
         endDate: new Date(data.endDate),
         venueId: data.venueId,
         organizerId: user.id,
         posterUrl: data.posterUrl || null,
         bannerUrl: data.bannerUrl || null,
         capacity: data.capacity,
         refundPolicy: data.refundPolicy,
         status: 'DRAFT',
       },
      include: {
        venue: true,
        organizer: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/events error:', e)
    if (e.errors) {
      return NextResponse.json({ error: 'Validation failed', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
