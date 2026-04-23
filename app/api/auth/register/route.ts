// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['CUSTOMER', 'VENDOR']),
  theaterName: z.string().optional(),
  location: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, role, theaterName, location } = schema.parse(body)

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    let theaterId = null
    if (role === 'VENDOR') {
      const theater = await db.theater.create({
        data: {
          name: theaterName || `${name}'s Theater`,
          location: location || 'Default Location',
          active: true,
        },
      })
      theaterId = theater.id
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        theaterId,
      },
    })

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
