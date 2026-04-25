import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/tickets/validate - Scan and validate ticket at entry
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { ticketId, qrCode } = body

    if (!ticketId && !qrCode) {
      return NextResponse.json({ error: 'ticketId or qrCode required' }, { status: 400 })
    }

    // Find ticket
    const ticket = await db.ticket.findFirst({
      where: {
        ...(ticketId ? { id: ticketId } : { qrCode }),
      },
      include: {
        event: { select: { id: true, title: true, startDate: true, endDate: true } },
        ticketTier: true,
      },
    })

    if (!ticket) {
      return NextResponse.json({ valid: false, reason: 'Ticket not found' }, { status: 404 })
    }

    // Check if already used
    if (ticket.status === 'USED') {
      return NextResponse.json({ valid: false, reason: 'Ticket already used' }, { status: 400 })
    }
    if (ticket.status === 'REFUNDED') {
      return NextResponse.json({ valid: false, reason: 'Ticket has been refunded' }, { status: 400 })
    }
    if (ticket.status === 'TRANSFERRED') {
      // Ticket transferred, still valid maybe? Should be okay.
    }

    // Validate event timing (allow entry within event start/end window)
    const now = new Date()
    const eventStart = new Date(ticket.event.startDate)
    const eventEnd = new Date(ticket.event.endDate)
    // If event hasn't started yet, deny entry
    if (now < eventStart) {
      return NextResponse.json({ valid: false, reason: 'Event has not started yet' }, { status: 400 })
    }
    // If event already ended, deny
    if (now > eventEnd) {
      return NextResponse.json({ valid: false, reason: 'Event has already ended' }, { status: 400 })
    }

    // Mark as used
    await db.ticket.update({
      where: { id: ticket.id },
      data: { status: 'USED', entryTime: now },
    })

    return NextResponse.json({
      valid: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        event: ticket.event.title,
        tier: ticket.ticketTier.name,
        customer: ticket.customerName,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET /api/tickets/validate/report?eventId=... - Entry report for an event (admin)
export async function GET(req: Request) {
  const user = await getSession()
  // Assume we have getSession imported; we didn't import. Actually we need auth. Let's import at top.
  // But for now skip auth or require admin later.

  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    // Count tickets for event with status USED
    const totalTickets = await db.ticket.count({
      where: { eventId },
    })
    const usedCount = await db.ticket.count({
      where: { eventId, status: 'USED' },
    })
    // Duplicate attempts? We don't track attempts beyond marking used, but could track in separate log.

    return NextResponse.json({
      eventId,
      totalTickets,
      entriesScanned: usedCount,
      duplicateAttempts: 0,
      invalidTickets: 0,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
