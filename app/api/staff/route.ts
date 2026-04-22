// app/api/staff/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(['SUPER_ADMIN', 'THEATER_OWNER', 'MANAGER', 'CLERK']),
  phone: z.string().optional(),
})

export async function GET() {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const staff = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ staff })
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const data = schema.parse(body)
    if (!data.password) return NextResponse.json({ error: 'Password required' }, { status: 400 })
    const hashed = await bcrypt.hash(data.password, 10)
    const member = await db.user.create({
      data: { name: data.name, email: data.email, password: hashed, role: data.role, phone: data.phone },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
    })
    return NextResponse.json({ member }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
