// app/api/coupons/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(['PERCENT', 'FLAT']),
  value: z.number().positive(),
  minAmount: z.number().default(0),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
})

export async function GET() {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ coupons })
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const coupon = await db.coupon.create({
      data: {
        ...data,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
