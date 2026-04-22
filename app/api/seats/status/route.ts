// app/api/seats/status/route.ts
import { NextResponse } from 'next/server'
import { getShowSeatStatus } from '@/lib/seat-lock'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const showId = searchParams.get('showId')
  if (!showId) return NextResponse.json({ error: 'showId required' }, { status: 400 })

  try {
    const { booked, locked } = await getShowSeatStatus(showId)
    return NextResponse.json({
      booked: [...booked],
      locked: Object.fromEntries(locked),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
