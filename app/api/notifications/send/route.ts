// app/api/notifications/send/route.ts
import { NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { sendSMS, sendEmail, logNotification } from '@/lib/notifications'
import { z } from 'zod'

const schema = z.object({
  channel: z.enum(['sms', 'email']),
  recipient: z.string(),
  title: z.string(),
  message: z.string(),
})

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    let result
    if (data.channel === 'sms') {
      result = await sendSMS({ to: data.recipient, message: data.message })
    } else {
      result = await sendEmail({ to: data.recipient, subject: data.title, html: `<p>${data.message}</p>` })
    }

    await logNotification(
      data.title,
      data.channel,
      data.recipient,
      data.title,
      data.message,
      result.success ? 'SENT' : 'FAILED',
      result.error
    )

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}