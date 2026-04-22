// app/api/shows/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  movieId: z.string(),
  screenId: z.string(),
  startTime: z.string(),
  priceVip: z.number().positive(),
  pricePremium: z.number().positive(),
  priceRegular: z.number().positive(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const movieId = searchParams.get('movieId')
    const status = searchParams.get('status')

    let startOfDay: Date, endOfDay: Date
    if (date) {
      startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
    } else {
      startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
    }

    const shows = await db.show.findMany({
      where: {
        startTime: { gte: startOfDay, lte: endOfDay },
        ...(movieId ? { movieId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        movie: true,
        screen: { include: { theater: true, seats: true } },
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PENDING'] } },
          include: { bookingSeats: true },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // Enrich with occupancy
    const enriched = shows.map(show => {
      const totalSeats = show.screen.seats.length
      const bookedSeatIds = new Set(show.bookings.flatMap(b => b.bookingSeats.map(bs => bs.seatId)))
      const bookedCount = bookedSeatIds.size
      return {
        ...show,
        totalSeats,
        bookedCount,
        availableCount: totalSeats - bookedCount,
        occupancyPct: totalSeats > 0 ? Math.round((bookedCount / totalSeats) * 100) : 0,
      }
    })

    return NextResponse.json({ shows: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const startTime = new Date(data.startTime)

    const movie = await db.movie.findUnique({ where: { id: data.movieId } })
    if (!movie) return NextResponse.json({ error: 'Movie not found' }, { status: 404 })

    const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000)

    // Check screen conflict
    const conflict = await db.show.findFirst({
      where: {
        screenId: data.screenId,
        status: { not: 'CANCELLED' },
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } },
        ],
      },
    })
    if (conflict) {
      return NextResponse.json({ error: 'Screen has a conflicting show at this time' }, { status: 409 })
    }

    const show = await db.show.create({
      data: { ...data, startTime, endTime },
      include: { movie: true, screen: { include: { theater: true } } },
    })
    return NextResponse.json({ show }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
