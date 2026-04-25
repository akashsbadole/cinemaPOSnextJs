// app/api/notifications/reminder/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendBookingConfirmation, sendSMS, sendEmail, sendWhatsApp, logNotification } from '@/lib/notifications'
import { format } from 'date-fns'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const hoursBefore = body.hoursBefore || 2
    const limit = body.limit || 50

    // Find shows starting in the next 2-3 hours
    const now = new Date()
    const startWindow = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000)
    const endWindow = new Date(startWindow.getTime() + 60 * 60 * 1000) // 1 hour window

    const upcomingShows = await db.show.findMany({
      where: {
        status: 'SCHEDULED',
        startTime: {
          gte: startWindow,
          lte: endWindow,
        },
      },
      include: {
        movie: true,
        screen: { include: { theater: true } },
        bookings: {
          where: { status: { in: ['CONFIRMED', 'PENDING'] } },
          include: {
            bookingSeats: { include: { seat: true } },
          },
        },
      },
      take: limit,
    })

    const results = []
    let sent = 0
    let failed = 0

    for (const show of upcomingShows) {
      // Group bookings by customer
      const customerBookings = new Map()
      
      for (const booking of show.bookings) {
        const key = booking.customerPhone || booking.customerEmail || 'unknown'
        if (!customerBookings.has(key)) {
          customerBookings.set(key, {
            phone: booking.customerPhone,
            email: booking.customerEmail,
            name: booking.customerName,
            ref: booking.bookingRef,
            seats: [],
          })
        }
        const cb = customerBookings.get(key)
        cb.seats.push(...booking.bookingSeats.map(bs => `${bs.seat.row}${bs.seat.number}`))
      }

      const showDate = format(new Date(show.startTime), 'dd MMM yyyy')
      const showTime = format(new Date(show.startTime), 'hh:mm a')

      for (const [_, cb] of customerBookings) {
        try {
          const message = `CinePOS Reminder: "${show.movie.title}" starts at ${showTime} today. Seats: ${cb.seats.join(', ')}. Please arrive 15 mins early.`

          // Send SMS
          if (cb.phone) {
            const smsResult = await sendSMS({ to: cb.phone, message: message })
            await logNotification('SHOW_REMINDER', 'sms', cb.phone, 'Show Reminder', message, smsResult.success ? 'SENT' : 'FAILED', smsResult.error)
            if (smsResult.success) sent++
            else failed++
          }

          // Send WhatsApp
          if (cb.phone) {
            const waResult = await sendWhatsApp({ to: cb.phone, message: message })
            await logNotification('SHOW_REMINDER', 'whatsapp', cb.phone, 'Show Reminder', message, waResult.success ? 'SENT' : 'FAILED', waResult.error)
          }

          // Send Email
          if (cb.email) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <div style="background: #1a1a2e; padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #E8A020;">🎬 CinePOS</h1>
                </div>
                <div style="background: #f8f8f8; padding: 20px; border-radius: 0 0 8px 8px;">
                  <h2 style="color: #1a1a2e;">⏰ Show Reminder</h2>
                  <p>Hi <strong>${cb.name || 'Guest'}</strong>, your show is starting soon!</p>
                  <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 0 0 8px;"><strong>Movie:</strong> ${show.movie.title}</p>
                    <p style="margin: 0 0 8px;"><strong>Time:</strong> ${showDate} at ${showTime}</p>
                    <p style="margin: 0 0 8px;"><strong>Theater:</strong> ${show.screen.theater.name}</p>
                    <p style="margin: 0;"><strong>Seats:</strong> ${cb.seats.join(', ')}</p>
                  </div>
                  <p style="color: #ef4444; font-weight: 600;">⚠ Please arrive 15 minutes before the show starts</p>
                </div>
              </div>
            `
            const emailResult = await sendEmail({
              to: cb.email,
              subject: `CinePOS Reminder: ${show.movie.title} at ${showTime}`,
              html: emailHtml,
            })
            await logNotification('SHOW_REMINDER', 'email', cb.email, 'Show Reminder', message, emailResult.success ? 'SENT' : 'FAILED', emailResult.error)
            if (emailResult.success) sent++
            else failed++
          }

          results.push({ ref: cb.ref, status: 'sent' })
        } catch (err) {
          results.push({ ref: cb.ref, status: 'failed', error: String(err) })
          failed++
        }
      }
    }

    return NextResponse.json({
      success: true,
      showsProcessed: upcomingShows.length,
      messagesSent: sent,
      failed,
      results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Allow cron to call without auth
export async function GET() {
  return POST({} as Request)
}