import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/tickets/[id]/transfer - Transfer ticket to another user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { toUserId } = body

    if (!toUserId) {
      return NextResponse.json({ error: 'toUserId is required' }, { status: 400 })
    }
    if (toUserId === user.id) {
      return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })
    }

    // Fetch ticket with event and current owner
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        booking: { select: { userId: true } },
      },
    })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    // Verify ownership: either ticket.customerEmail matches user's email or booking's userId matches user.id
    const isOwner = ticket.booking?.userId === user.id
    // Also maybe ticket.customerEmail matches? We'll rely on booking ownership.
    if (!isOwner) {
      return NextResponse.json({ error: 'You do not own this ticket' }, { status: 403 })
    }

    // Check ticket status
    if (ticket.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Ticket cannot be transferred' }, { status: 400 })
    }

    // Check event start time
    if (new Date() >= new Date(ticket.event.startDate)) {
      return NextResponse.json({ error: 'Cannot transfer after event start' }, { status: 400 })
    }

    // Get recipient user
    const recipient = await db.user.findUnique({ where: { id: toUserId } })
    if (!recipient) return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 })

    // Perform transfer: update ticket ownership details
    await db.ticket.update({
      where: { id },
      data: {
        customerName: recipient.name,
        customerEmail: recipient.email,
        customerPhone: recipient.phone || '',
        status: 'TRANSFERRED',
      },
    })

    // Could log transfer history (not modeled). Could also create a TicketResale-like entry with zero price? Not now.

    return NextResponse.json({ message: 'Ticket transferred successfully' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
