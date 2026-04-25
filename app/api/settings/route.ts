// app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET() {
  const settings = await db.systemSetting.findMany()
  const settingsMap = settings.reduce((acc, s) => {
    // Hide sensitive keys from public GET
    if (s.key.includes('SECRET') || s.key.includes('API_KEY')) return acc
    return { ...acc, [s.key]: s.value }
  }, {})
  return NextResponse.json(settingsMap)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || !hasPermission(session.role, 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const updates = Object.entries(body).map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
    await Promise.all(updates)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
