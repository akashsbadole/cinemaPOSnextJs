// app/api/reports/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { format, subDays } from 'date-fns'

export async function GET(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'dashboard'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const exportFormat = searchParams.get('export')

  const fromDate = from ? new Date(from) : subDays(new Date(), 30)
  fromDate.setHours(0, 0, 0, 0)
  const toDate = to ? new Date(to) : new Date()
  toDate.setHours(23, 59, 59, 999)

  try {
    // Dashboard
    if (type === 'dashboard') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999)

      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: today, lte: todayEnd }, status: { in: ['CONFIRMED', 'REFUNDED'] } },
        include: { bookingSeats: true }
      })

      const shows = await db.show.findMany({
        where: { startTime: { gte: today, lte: todayEnd } }
      })

      const revenue = bookings.reduce((s, b) => s + b.finalAmount, 0)
      const tickets = bookings.reduce((s, b) => s + b.bookingSeats.length, 0)

      return NextResponse.json({
        todayRevenue: revenue,
        todayBookings: bookings.length,
        todayTickets: tickets,
        todayShows: shows.length
      })
    }

    // Hourly heatmap
    if (type === 'hourly_heatmap') {
      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: 'CONFIRMED' }
      })

      const hourly = Array(24).fill(0).map((h, i) => ({ hour: i, label: `${i}:00`, bookings: 0, revenue: 0 }))
      bookings.forEach(b => {
        const h = b.createdAt.getHours()
        hourly[h].bookings++
        hourly[h].revenue += b.finalAmount
      })

      return NextResponse.json({ hourly })
    }

    // Week comparison
    if (type === 'week_comparison') {
      const daysDiff = 7
      const currStart = fromDate
      const prevStart = subDays(fromDate, daysDiff)

      const [curr, prev] = await Promise.all([
        db.booking.aggregate({ where: { createdAt: { gte: currStart, lte: toDate }, status: 'CONFIRMED' }, _sum: { finalAmount: true }, _count: true }),
        db.booking.aggregate({ where: { createdAt: { gte: prevStart, lte: subDays(fromDate, 1) }, status: 'CONFIRMED' }, _sum: { finalAmount: true }, _count: true })
      ])

      const currRev = curr._sum.finalAmount || 0
      const prevRev = prev._sum.finalAmount || 0

      return NextResponse.json({
        current: { revenue: currRev, bookings: curr._count },
        previous: { revenue: prevRev, bookings: prev._count },
        growth: prevRev > 0 ? ((currRev - prevRev) / prevRev * 100).toFixed(1) : 0
      })
    }

    // Customer retention
    if (type === 'customer_retention') {
      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: 'CONFIRMED', customerPhone: { not: null } }
      })

      const stats = new Map<string, number>()
      bookings.forEach(b => { const p = b.customerPhone!; stats.set(p, (stats.get(p) || 0) + 1) })
      const counts = Array.from(stats.values())
      const repeat = counts.filter(c => c > 1).length

      return NextResponse.json({
        totalCustomers: counts.length,
        repeatCustomers: repeat,
        retentionRate: counts.length ? (repeat / counts.length * 100).toFixed(1) : 0
      })
    }

    // Seat preference
    if (type === 'seat_preference') {
      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: 'CONFIRMED' },
        include: { bookingSeats: { include: { seat: true } } }
      })

      const types: Record<string, number> = { REGULAR: 0, PREMIUM: 0, VIP: 0 }
      bookings.forEach(b => { b.bookingSeats.forEach(bs => { const t = bs.seat.type || 'REGULAR'; if (types[t] !== undefined) types[t]++ }) })

      return NextResponse.json({ seatTypes: types })
    }

    // Forecasting
    if (type === 'forecasting') {
      const days = Array(7).fill(0).map((_, i) => {
        const d = subDays(new Date(), 6 - i)
        d.setHours(0, 0, 0, 0)
        return d
      })
      const daily = await Promise.all(days.map(async d => {
        const end = new Date(d.getTime() + 86400000)
        const agg = await db.booking.aggregate({ where: { createdAt: { gte: d, lte: end }, status: 'CONFIRMED' }, _sum: { finalAmount: true } })
        return { date: format(d, 'EEE'), revenue: agg._sum.finalAmount || 0 }
      }))

      const revenues = daily.map(d => d.revenue)
      const avg = revenues.reduce((a, b) => a + b, 0) / 7

      return NextResponse.json({
        last7Days: daily,
        avgDailyRevenue: Math.round(avg),
        trend: revenues[6] >= revenues[0] ? 'up' : 'down'
      })
    }

    // CSV Export
    if (exportFormat === 'csv') {
      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: 'CONFIRMED' },
        include: { show: { include: { movie: true } } },
        orderBy: { createdAt: 'desc' }
      })

      const csv = 'Ref,Date,Movie,Amount\n' + bookings.map(b => `${b.bookingRef},${format(b.createdAt, 'yyyy-MM-dd')},${b.show.movie.title},${b.finalAmount}`).join('\n')

      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="bookings.csv"' } })
    }

    // PDF Export (HTML)
    if (exportFormat === 'pdf') {
      const bookings = await db.booking.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate }, status: 'CONFIRMED' },
        include: { show: { include: { movie: true } }, bookingSeats: true }
      })

      const revenue = bookings.reduce((s, b) => s + b.finalAmount, 0)
      const html = `<!DOCTYPE html><html><head><style>body{font-family:Arial;padding:20px}.header{background:#1a1a2e;color:white;padding:20px}.kpi{display:flex;gap:20px;margin:20px 0}.kpi>div{background:#f5f5f5;padding:20px;border-radius:8px;flex:1;text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#1a1a2e;color:white}</style></head><body><div class="header"><h1>CinePOS Report</h1><p>${format(fromDate, 'yyyy-MM-dd')} - ${format(toDate, 'yyyy-MM-dd')}</p></div><div class="kpi"><div><strong>₹${revenue.toLocaleString()}</strong><p>Revenue</p></div><div><strong>${bookings.length}</strong><p>Bookings</p></div></div><table><tr><th>Ref</th><th>Date</th><th>Movie</th><th>Amount</th>${bookings.slice(0, 30).map(b => `<tr><td>${b.bookingRef}</td><td>${format(b.createdAt, 'dd/MM/yy')}</td><td>${b.show.movie.title}</td><td>₹${b.finalAmount}</td></tr>`).join('')}</table></body></html>`

      return new NextResponse(html, { headers: { 'Content-Type': 'text/html', 'Content-Disposition': 'attachment; filename="report.html"' } })
    }

    return NextResponse.json({})
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}