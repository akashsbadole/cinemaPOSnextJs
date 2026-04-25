import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/waitlist/[id] - Get specific waitlist entry
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const entry = await db.waitlist.findUnique({
    where: { id },
    include: {
      event: true,
      ticketTier: true,
    },
  })
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  if (entry.customerId !== user.id && !['SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ entry })
}

// DELETE /api/waitlist/[id] - Leave waitlist
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const entry = await db.waitlist.findUnique({ where: { id } })
  if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  if (entry.customerId !== user.id && !['SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.waitlist.delete({ where: { id } })
  return NextResponse.json({ message: 'Waitlist entry removed' })
}
