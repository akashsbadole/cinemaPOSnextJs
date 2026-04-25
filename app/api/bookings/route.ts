// app/api/bookings/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { lockSeats, generateBookingRef } from '@/lib/seat-lock'
import { sendBookingConfirmation } from '@/lib/notifications'
import { generateTicketPDF, TicketData } from '@/lib/ticket'
import { format } from 'date-fns'
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
  foodItems: z.array(z.object({
    foodItemId: z.string(),
    quantity: z.number().int().min(1).max(99),
  })).optional(),
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
          bookingItems: { include: { foodItem: true } },
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
  // Allow guest bookings (user can be null for web bookings)

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

    // Validate and fetch food items
    let foodTotal = 0
    const foodPrices: { foodItemId: string; quantity: number; price: number }[] = []
    if (data.foodItems && data.foodItems.length > 0) {
      const foodItemIds = data.foodItems.map(f => f.foodItemId)
      const foodItems = await db.foodItem.findMany({ where: { id: { in: foodItemIds } } })
      const foodMap = new Map(foodItems.map(f => [f.id, f]))

      for (const fi of data.foodItems) {
        const item = foodMap.get(fi.foodItemId)
        if (!item) return NextResponse.json({ error: `Food item ${fi.foodItemId} not found` }, { status: 400 })
        if (!item.available) return NextResponse.json({ error: `Food item '${item.name}' is not available` }, { status: 400 })
        foodTotal += item.price * fi.quantity
        foodPrices.push({ foodItemId: fi.foodItemId, quantity: fi.quantity, price: item.price })
      }
    }

    totalAmount += foodTotal

    // Apply coupon
    let discountAmount = 0
    if (data.couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: data.couponCode,
          active: true,
          validFrom: { lte: new Date() },
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } },
          ],
        },
      })
      if (coupon) {
        const withinUsageLimit = coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit
        if (withinUsageLimit && totalAmount >= coupon.minAmount) {
          if (coupon.type === 'PERCENT') {
            discountAmount = Math.min(totalAmount * (coupon.value / 100), coupon.maxDiscount || Infinity)
          } else {
            discountAmount = coupon.value
          }
          await db.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } })
        }
      }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount)
    const bookingRef = await generateBookingRef()

    // Create booking in transaction
    const booking = await db.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingRef,
          userId: user?.id ?? null,
          showId: data.showId,
          customerName: data.customerName || user?.name || '',
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || undefined,
          status: 'CONFIRMED',
          totalAmount,
          discountAmount,
          finalAmount,
          channel: data.channel,
          bookingSeats: { create: seatPrices },
          bookingItems: foodPrices.length > 0 ? { create: foodPrices } : undefined,
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
          bookingItems: { include: { foodItem: true } },
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
    
    // Generate ticket PDF for email attachment
    const ticketData: TicketData = {
      bookingRef: booking.bookingRef,
      movieTitle: booking.show.movie.title,
      showDate: format(showStart, 'dd MMM yyyy'),
      showTime: format(showStart, 'hh:mm a'),
      screen: booking.show.screen.name,
      theater: booking.show.screen.theater.name,
      seats: booking.bookingSeats.map(bs => `${bs.seat.row}${bs.seat.number}`),
      customerName: booking.customerName || 'Guest',
      totalAmount: booking.finalAmount,
      format: booking.show.movie.format,
    }
    
    const pdfBuffer = await generateTicketPDF(ticketData)
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')
    
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
      ticketPdf: pdfBase64,
    }).catch(console.error)

    return NextResponse.json({ booking }, { status: 201 })
  } catch (e: any) {
    console.error('Booking error:', e)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
