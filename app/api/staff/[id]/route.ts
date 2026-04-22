// app/api/staff/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const update: any = { name: body.name, role: body.role, phone: body.phone, active: body.active }
    if (body.password) update.password = await bcrypt.hash(body.password, 10)
    const member = await db.user.update({
      where: { id: params.id },
      data: update,
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    })
    return NextResponse.json({ member })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    await db.user.update({ where: { id: params.id }, data: { active: false } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
