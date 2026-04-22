// app/api/reports/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'dashboard'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  fromDate.setHours(0, 0, 0, 0)
  const toDate = to ? new Date(to) : new Date()
  toDate.setHours(23, 59, 59, 999)

  try {
    if (type === 'dashboard') {
      // Today stats
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayEnd = new Date(todayEnd); yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)

      const [todayBookings, yesterdayBookings, todayShows, liveShows] = await Promise.all([
        db.booking.findMany({
          where: { createdAt: { gte: today, lte: todayEnd }, status: { in: ['CONFIRMED', 'REFUNDED'] } },
          include: { bookingSeats: true },
        }),
        db.booking.findMany({
          where: { createdAt: { gte: yesterday, lte: yesterdayEnd }, status: { in: ['CONFIRMED', 'REFUNDED'] } },
        }),
        db.show.findMany({
          where: { startTime: { gte: today, lte: todayEnd } },
          include: {
            movie: true, screen: { include: { theater: true, seats: true } },
            bookings: { where: { status: { in: ['CONFIRMED', 'PENDING'] } }, include: { bookingSeats: true } },
          },
          orderBy: { startTime: 'asc' },
        }),
        db.show.count({ where: { status: 'LIVE' } }),
      ])

      const todayRevenue = todayBookings.reduce((s, b) => s + b.finalAmount, 0)
      const yesterdayRevenue = yesterdayBookings.reduce((s, b) => s + b.finalAmount, 0)
      const todayTickets = todayBookings.reduce((s, b) => s + b.bookingSeats.length, 0)
      const yesterdayTickets = yesterdayBookings.length

      const showsWithOcc = todayShows.map(show => {
        const total = show.screen.seats.length
        const booked = new Set(show.bookings.flatMap(b => b.bookingSeats.map(bs => bs.seatId))).size
        return { ...show, totalSeats: total, bookedCount: booked, occupancyPct: total > 0 ? Math.round((booked / total) * 100) : 0 }
      })

      const cancellations = await db.booking.count({ where: { createdAt: { gte: today }, status: 'CANCELLED' } })

      return NextResponse.json({
        todayRevenue, yesterdayRevenue,
        revenueGrowth: yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : 0,
        todayTickets, yesterdayTickets,
        ticketGrowth: yesterdayTickets > 0 ? ((todayTickets - yesterdayTickets) / yesterdayTickets * 100).toFixed(1) : 0,
        liveShows,
        cancellations,
        shows: showsWithOcc,
      })
    }

    if (type === 'revenue') {
      // Daily revenue for date range
      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: { in: ['CONFIRMED', 'REFUNDED'] } },
        select: { createdAt: true, finalAmount: true, channel: true },
      })

      const byDay: Record<string, { date: string; revenue: number; count: number }> = {}
      bookings.forEach(b => {
        const day = b.createdAt.toISOString().slice(0, 10)
        if (!byDay[day]) byDay[day] = { date: day, revenue: 0, count: 0 }
        byDay[day].revenue += b.finalAmount
        byDay[day].count += 1
      })

      const totalRevenue = bookings.reduce((s, b) => s + b.finalAmount, 0)
      const byChannel = bookings.reduce((acc: any, b) => {
        acc[b.channel] = (acc[b.channel] || 0) + b.finalAmount
        return acc
      }, {})

      return NextResponse.json({ daily: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)), totalRevenue, byChannel })
    }

    if (type === 'occupancy') {
      const shows = await db.show.findMany({
        where: { startTime: { gte: fromDate, lte: toDate } },
        include: {
          movie: true,
          screen: { include: { seats: true } },
          bookings: { where: { status: { in: ['CONFIRMED'] } }, include: { bookingSeats: true } },
        },
        orderBy: { startTime: 'desc' },
      })

      const enriched = shows.map(show => {
        const total = show.screen.seats.length
        const booked = new Set(show.bookings.flatMap(b => b.bookingSeats.map(bs => bs.seatId))).size
        const revenue = show.bookings.reduce((s, b) => {
          return s + b.bookingSeats.reduce((ss, bs) => ss + bs.price, 0)
        }, 0)
        return {
          id: show.id, movie: show.movie.title, screen: show.screen.name,
          startTime: show.startTime, status: show.status,
          total, booked, available: total - booked,
          occupancyPct: total > 0 ? Math.round((booked / total) * 100) : 0,
          revenue,
        }
      })

      const avgOccupancy = enriched.length > 0
        ? Math.round(enriched.reduce((s, e) => s + e.occupancyPct, 0) / enriched.length)
        : 0

      return NextResponse.json({ shows: enriched, avgOccupancy })
    }

    if (type === 'movies') {
      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: 'CONFIRMED' },
        include: {
          show: { include: { movie: true } },
          bookingSeats: true,
        },
      })

      const byMovie: Record<string, any> = {}
      bookings.forEach(b => {
        const mid = b.show.movie.id
        if (!byMovie[mid]) byMovie[mid] = { id: mid, title: b.show.movie.title, revenue: 0, tickets: 0, bookings: 0 }
        byMovie[mid].revenue += b.finalAmount
        byMovie[mid].tickets += b.bookingSeats.length
        byMovie[mid].bookings += 1
      })

      return NextResponse.json({ movies: Object.values(byMovie).sort((a: any, b: any) => b.revenue - a.revenue) })
    }

    if (type === 'cancellations') {
      const cancellations = await db.cancellation.findMany({
        where: { cancelledAt: { gte: fromDate, lte: toDate } },
        include: {
          booking: { include: { show: { include: { movie: true } } } },
        },
        orderBy: { cancelledAt: 'desc' },
      })
      const totalRefund = cancellations.reduce((s, c) => s + c.refundAmount, 0)
      return NextResponse.json({ cancellations, totalRefund, count: cancellations.length })
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
