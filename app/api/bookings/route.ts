// app/api/bookings/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { lockSeats, generateBookingRef } from '@/lib/seat-lock'
import { sendBookingConfirmation } from '@/lib/notifications'
import { z } from 'zod'

const schema = z.object({
  showId: z.string(),
  seatIds: z.array(z.string()).min(1).max(10),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'WALLET', 'ONLINE']),
  couponCode: z.string().optional(),
  channel: z.enum(['POS', 'ONLINE', 'PHONE']).default('POS'),
  sessionId: z.string(),
})

export async function GET(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const date = searchParams.get('date')

    let dateFilter = {}
    if (date) {
      const d = new Date(date)
      dateFilter = {
        createdAt: {
          gte: new Date(d.setHours(0, 0, 0, 0)),
          lte: new Date(d.setHours(23, 59, 59, 999)),
        },
      }
    }

    const where: any = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { bookingRef: { contains: search } },
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
        ],
      } : {}),
      ...dateFilter,
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          show: { include: { movie: true, screen: { include: { theater: true } } } },
          bookingSeats: { include: { seat: true } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.booking.count({ where }),
    ])

    return NextResponse.json({ bookings, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Get show with pricing
    const show = await db.show.findUnique({
      where: { id: data.showId },
      include: { screen: { include: { seats: true } }, movie: true },
    })
    if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    if (show.status === 'CANCELLED') return NextResponse.json({ error: 'Show is cancelled' }, { status: 400 })
    if (show.status === 'COMPLETED') return NextResponse.json({ error: 'Show has ended' }, { status: 400 })

    // Attempt to lock seats
    const lockResult = await lockSeats(data.showId, data.seatIds, data.sessionId)
    if (!lockResult.success) {
      return NextResponse.json({
        error: 'Some seats are no longer available',
        conflictSeats: lockResult.conflict,
      }, { status: 409 })
    }

    // Calculate pricing
    const seatMap = new Map(show.screen.seats.map(s => [s.id, s]))
    let totalAmount = 0
    const seatPrices: { seatId: string; price: number }[] = []

    for (const seatId of data.seatIds) {
      const seat = seatMap.get(seatId)
      if (!seat) return NextResponse.json({ error: `Seat ${seatId} not found` }, { status: 400 })
      const price = seat.type === 'VIP' ? show.priceVip : seat.type === 'PREMIUM' ? show.pricePremium : show.priceRegular
      totalAmount += price
      seatPrices.push({ seatId, price })
    }

    // Apply coupon
    let discountAmount = 0
    if (data.couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: data.couponCode,
          active: true,
          validFrom: { lte: new Date() },
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          OR: [{ usageLimit: null }, { usageCount: { lt: db.coupon.fields.usageLimit } }],
        },
      })
      if (coupon && totalAmount >= coupon.minAmount) {
        if (coupon.type === 'PERCENT') {
          discountAmount = Math.min(totalAmount * (coupon.value / 100), coupon.maxDiscount || Infinity)
        } else {
          discountAmount = coupon.value
        }
        await db.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } })
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount)
    const bookingRef = await generateBookingRef()

    // Create booking in transaction
    const booking = await db.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingRef,
          userId: user.id,
          showId: data.showId,
          customerName: data.customerName || user.name,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || undefined,
          status: 'CONFIRMED',
          totalAmount,
          discountAmount,
          finalAmount,
          channel: data.channel,
          bookingSeats: { create: seatPrices },
          payment: {
            create: {
              method: data.paymentMethod,
              amount: finalAmount,
              status: 'COMPLETED',
              paidAt: new Date(),
            },
          },
        },
        include: {
          show: { include: { movie: true, screen: { include: { theater: true } } } },
          bookingSeats: { include: { seat: true } },
          payment: true,
        },
      })

      // Remove seat locks
      await tx.seatLock.deleteMany({
        where: { showId: data.showId, seatId: { in: data.seatIds } },
      })

      return b
    })

    // Send notification (async, don't wait)
    const showStart = new Date(booking.show.startTime)
    sendBookingConfirmation({
      bookingRef: booking.bookingRef,
      customerName: booking.customerName || '',
      customerPhone: booking.customerPhone || '',
      customerEmail: booking.customerEmail || undefined,
      movieTitle: booking.show.movie.title,
      showDate: showStart.toLocaleDateString('en-IN'),
      showTime: showStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      screen: booking.show.screen.name,
      seats: booking.bookingSeats.map(bs => `${bs.seat.row}${bs.seat.number}`),
      totalAmount: booking.finalAmount,
    }).catch(console.error)

    return NextResponse.json({ booking }, { status: 201 })
  } catch (e: any) {
    console.error('Booking error:', e)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
