// app/api/seats/lock/route.ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { lockSeats, unlockSeats } from '@/lib/seat-lock'
import { z } from 'zod'

const lockSchema = z.object({
  showId: z.string(),
  seatIds: z.array(z.string()),
  sessionId: z.string(),
})

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = lockSchema.parse(body)
    const result = await lockSeats(data.showId, data.seatIds, data.sessionId)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = lockSchema.parse(body)
    await unlockSeats(data.showId, data.seatIds, data.sessionId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
