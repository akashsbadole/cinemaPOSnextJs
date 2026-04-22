// app/api/coupons/validate/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ code: z.string(), amount: z.number() })

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { code, amount } = schema.parse(await req.json())
    const coupon = await db.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        active: true,
        validFrom: { lte: new Date() },
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
    })

    if (!coupon) return NextResponse.json({ valid: false, error: 'Invalid or expired coupon' })
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Coupon usage limit reached' })
    }
    if (amount < coupon.minAmount) {
      return NextResponse.json({ valid: false, error: `Minimum order ₹${coupon.minAmount} required` })
    }

    let discount = 0
    if (coupon.type === 'PERCENT') {
      discount = Math.min(amount * (coupon.value / 100), coupon.maxDiscount ?? Infinity)
    } else {
      discount = Math.min(coupon.value, amount)
    }

    return NextResponse.json({
      valid: true,
      discount: Math.round(discount),
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
