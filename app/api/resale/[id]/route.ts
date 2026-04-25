import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// DELETE /api/resale/[id] - Delist a ticket from resale marketplace
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const listing = await db.ticketResale.findUnique({ where: { id } })
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (listing.sellerId !== user.id && !['SUPER_ADMIN', 'THEATER_OWNER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (listing.status !== 'LISTED') {
      return NextResponse.json({ error: 'Only active listings can be delisted' }, { status: 400 })
    }

    await db.ticketResale.delete({ where: { id } })
    return NextResponse.json({ message: 'Listing removed' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
