import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { purchaseResaleTicket } from '@/lib/resale-handler'

// POST /api/resale/[id]/purchase - Buy a resale ticket
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { paymentMethod } = body // maybe additional payment details

    const result = await purchaseResaleTicket(id, user.id, paymentMethod || 'ONLINE')
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ message: 'Resale purchase successful', bookingId: result.bookingId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
