// app/api/food/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(['POPCORN', 'DRINKS', 'SNACKS', 'COMBO']),
  imageUrl: z.string().optional(),
  available: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const available = searchParams.get('available')

    const where: any = {}
    if (category) where.category = category
    if (available !== null) where.available = available === 'true'

    const items = await db.foodItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const item = await db.foodItem.create({ data })
    return NextResponse.json({ item }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}