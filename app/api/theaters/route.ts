// app/api/theaters/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
})

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const theaters = await db.theater.findMany({
    include: { screens: { include: { _count: { select: { seats: true } } } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ theaters })
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const data = schema.parse(await req.json())
    const theater = await db.theater.create({ data })
    return NextResponse.json({ theater }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
