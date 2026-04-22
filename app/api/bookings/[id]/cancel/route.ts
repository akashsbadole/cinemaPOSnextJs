// app/api/bookings/[id]/cancel/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  reason: z.string().optional(),
  refundMethod: z.enum(['WALLET', 'ORIGINAL', 'CASH']).default('WALLET'),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { reason, refundMethod } = schema.parse(body)

    const booking = await db.booking.findFirst({
      where: { OR: [{ id: params.id }, { bookingRef: params.id }] },
      include: { show: true, payment: true },
    })

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    if (booking.status === 'REFUNDED') return NextResponse.json({ error: 'Already refunded' }, { status: 400 })

    // Refund rules
    const now = new Date()
    const showStart = new Date(booking.show.startTime)
    const minutesUntilShow = (showStart.getTime() - now.getTime()) / (1000 * 60)

    let refundAmount = 0
    let refundStatus: 'APPROVED' | 'REJECTED' = 'REJECTED'

    if (minutesUntilShow > 60) {
      refundAmount = booking.finalAmount
      refundStatus = 'APPROVED'
    } else if (minutesUntilShow > 0) {
      refundAmount = booking.finalAmount * 0.5
      refundStatus = 'APPROVED'
    } else {
      refundAmount = 0
      refundStatus = 'REJECTED'
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: refundAmount > 0 ? 'REFUNDED' : 'CANCELLED' },
      })

      await tx.cancellation.create({
        data: {
          bookingId: booking.id,
          reason,
          refundAmount,
          refundMethod,
          status: refundStatus,
        },
      })

      if (booking.payment && refundAmount > 0) {
        await tx.payment.update({
          where: { bookingId: booking.id },
          data: { status: 'REFUNDED' },
        })
      }

      return updated
    })

    return NextResponse.json({ booking: result, refundAmount, refundStatus })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
