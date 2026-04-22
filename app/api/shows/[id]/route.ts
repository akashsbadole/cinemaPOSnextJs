// app/api/shows/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { getShowSeatStatus } from '@/lib/seat-lock'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const show = await db.show.findUnique({
      where: { id: params.id },
      include: {
        movie: true,
        screen: {
          include: {
            theater: true,
            seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] },
          },
        },
      },
    })
    if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { booked, locked } = await getShowSeatStatus(params.id)

    const seatsWithStatus = show.screen.seats.map(seat => ({
      ...seat,
      status: booked.has(seat.id) ? 'booked' : locked.has(seat.id) ? 'locked' : 'available',
      price: seat.type === 'VIP' ? show.priceVip : seat.type === 'PREMIUM' ? show.pricePremium : show.priceRegular,
    }))

    return NextResponse.json({ show: { ...show, screen: { ...show.screen, seats: seatsWithStatus } } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const show = await db.show.update({ where: { id: params.id }, data: body })
    return NextResponse.json({ show })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    await db.show.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
