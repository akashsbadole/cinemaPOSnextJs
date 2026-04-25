import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { listTicketForResale, validateResalePrice, calculateCommission } from '@/lib/resale-handler'

// GET /api/resale - Marketplace (list all active resale listings)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const tierId = searchParams.get('tierId')

    const where: any = { status: 'LISTED' }
    if (eventId) where.ticket = { eventId }
    if (tierId) where.ticket = { ...where.ticket, ticketTierId: tierId }
    if (minPrice) where.resalePrice = { ...where.resalePrice, gte: parseFloat(minPrice) }
    if (maxPrice) where.resalePrice = { ...where.resalePrice, lte: parseFloat(maxPrice) }

    const listings = await db.ticketResale.findMany({
      where,
      include: {
        ticket: {
          include: {
            event: { select: { id: true, title: true, startDate: true, venue: true } },
            ticketTier: { select: { id: true, name: true } },
          },
        },
        seller: { select: { id: true, name: true } },
      },
      orderBy: { listedAt: 'desc' },
    })

    // Map to friendly format including original price?
    const enriched = listings.map(l => ({
      id: l.id,
      ticketNumber: l.ticket.ticketNumber,
      event: l.ticket.event,
      tier: l.ticket.ticketTier,
      originalPrice: l.ticket.originalPrice,
      resalePrice: l.resalePrice,
      platformCommission: l.platformCommission,
      sellerProceeds: l.sellerProceeds,
      seller: l.seller,
      listedAt: l.listedAt,
      resaleCount: l.ticket.resaleCount,
    }))

    return NextResponse.json({ listings: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/resale - List a ticket for resale
export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { ticketId, resalePrice } = body

    if (!ticketId || !resalePrice) {
      return NextResponse.json({ error: 'ticketId and resalePrice are required' }, { status: 400 })
    }

    const result = await listTicketForResale(ticketId, user.id, resalePrice)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ listingId: result.listingId }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
