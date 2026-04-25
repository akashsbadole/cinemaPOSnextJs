// app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'

const NOTIFICATION_KEYS = [
  'SMS_ENABLED',
  'EMAIL_ENABLED', 
  'WHATSAPP_ENABLED',
  'AUTO_SEND_REMINDER',
  'REMINDER_HOURS_BEFORE',
  'RAZORPAY_ENABLED',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
]

const NOTIFICATION_DEFAULTS: Record<string, string> = {
  SMS_ENABLED: 'true',
  EMAIL_ENABLED: 'true',
  WHATSAPP_ENABLED: 'false',
  AUTO_SEND_REMINDER: 'true',
  REMINDER_HOURS_BEFORE: '2',
}

export async function GET() {
  const settings = await db.systemSetting.findMany()
  
  // Get or create notification settings
  const notificationSettings = await Promise.all(
    NOTIFICATION_KEYS.map(async (key) => {
      const existing = settings.find(s => s.key === key)
      if (!existing) {
        const defaultValue = NOTIFICATION_DEFAULTS[key] || ''
        return db.systemSetting.upsert({
          where: { key },
          update: {},
          create: { key, value: defaultValue },
        })
      }
      return existing
    })
  )
  
  const allSettings = [...settings, ...await Promise.all(notificationSettings)]
  const settingsMap = allSettings.reduce((acc: Record<string,string>, s: any) => {
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
