// app/api/theaters/[id]/screens/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const seatRowSchema = z.object({
  row: z.string(),
  count: z.number().min(1).max(30),
  type: z.enum(['VIP', 'PREMIUM', 'REGULAR']),
})

const schema = z.object({
  name: z.string().min(1),
  seatLayout: z.array(seatRowSchema),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const screens = await db.screen.findMany({
    where: { theaterId: params.id, active: true },
    include: { seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] } },
  })
  return NextResponse.json({ screens })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { name, seatLayout } = schema.parse(body)
    const totalSeats = seatLayout.reduce((s, r) => s + r.count, 0)

    const screen = await db.$transaction(async (tx) => {
      const s = await tx.screen.create({ data: { theaterId: params.id, name, totalSeats } })
      const seats = seatLayout.flatMap(row =>
        Array.from({ length: row.count }, (_, i) => ({
          screenId: s.id,
          row: row.row,
          number: i + 1,
          type: row.type,
          coordX: (i - row.count / 2) * 0.8,
          coordY: 0,
          coordZ: ['A','B','C','D','E','F','G','H','I','J'].indexOf(row.row) * 1.2,
        }))
      )
      await tx.seat.createMany({ data: seats })
      return s
    })

    return NextResponse.json({ screen }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
