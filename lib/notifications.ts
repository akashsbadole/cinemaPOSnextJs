// lib/notifications.ts
import { db } from './db'

interface SendSMSParams {
  to: string
  message: string
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY
  if (!apiKey) {
    console.log('[SMS] No API key configured, skipping')
    return { success: false, error: 'SMS not configured' }
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        language: 'english',
        route: 'q',
        numbers: to.replace(/\D/g, '').slice(-10),
      }),
    })

    const data = await response.json()
    if (data.return === true) {
      return { success: true, messageId: data.messages?.[0]?.message_id }
    }
    return { success: false, error: data.message || 'SMS failed' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[Email] No API key configured, skipping')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CinePOS <noreply@cinepos.app>',
        to,
        subject,
        html,
      }),
    })

    const data = await response.json()
    if (data.id) {
      return { success: true, messageId: data.id }
    }
    return { success: false, error: data.message || 'Email failed' }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function logNotification(
  type: string,
  channel: 'sms' | 'email' | 'whatsapp',
  recipient: string,
  title: string,
  message: string,
  status: 'PENDING' | 'SENT' | 'FAILED',
  error?: string
) {
  return db.notification.create({
    data: {
      type,
      channel,
      recipient,
      title,
      message,
      status,
      sentAt: status === 'SENT' ? new Date() : undefined,
    },
  })
}

interface BookingNotificationData {
  bookingRef: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  movieTitle: string
  showDate: string
  showTime: string
  screen: string
  seats: string[]
  totalAmount: number
}

export async function sendBookingConfirmation(data: BookingNotificationData) {
  const smsMessage = `CinePOS: Your booking ${data.bookingRef} is confirmed! Movie: ${data.movieTitle}, Show: ${data.showDate} ${data.showTime}, Seats: ${data.seats.join(', ')}, Amount: ₹${data.totalAmount}. Enjoy your movie!`

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 24px; color: white; text-align: center;">
        <h1 style="margin: 0; color: #E8A020;">🎬 CinePOS</h1>
        <p style="margin: 8px 0 0; color: #aaa;">Booking Confirmation</p>
      </div>
      <div style="padding: 24px; background: #f8f8f8;">
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <div style="color: #20C878; font-size: 24px; margin-bottom: 12px;">✓ Booking Confirmed</div>
          <p style="margin: 0 0 16px; color: #666;">Dear <strong>${data.customerName}</strong>, your booking has been confirmed!</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
            <p style="margin: 0 0 8px;"><strong>Booking Ref:</strong> ${data.bookingRef}</p>
            <p style="margin: 0 0 8px;"><strong>Movie:</strong> ${data.movieTitle}</p>
            <p style="margin: 0 0 8px;"><strong>Show:</strong> ${data.showDate} at ${data.showTime}</p>
            <p style="margin: 0 0 8px;"><strong>Screen:</strong> ${data.screen}</p>
            <p style="margin: 0 0 8px;"><strong>Seats:</strong> ${data.seats.join(', ')}</p>
            <p style="margin: 0;"><strong>Amount Paid:</strong> <span style="color: #E8A020; font-size: 18px;">₹${data.totalAmount}</span></p>
          </div>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          Please arrive 15 minutes before the show. Outside food not allowed.<br>
          © CinePOS - Movie Theater Management
        </p>
      </div>
    </div>
  `

  const results = []

  if (data.customerPhone) {
    const smsResult = await sendSMS({ to: data.customerPhone, message: smsMessage })
    await logNotification('BOOKING_CONFIRM', 'sms', data.customerPhone, 'Booking Confirmed', smsMessage, smsResult.success ? 'SENT' : 'FAILED', smsResult.error)
    results.push({ channel: 'sms', ...smsResult })
  }

  if (data.customerEmail) {
    const emailResult = await sendEmail({
      to: data.customerEmail,
      subject: `CinePOS: Booking Confirmed - ${data.bookingRef}`,
      html: emailHtml,
    })
    await logNotification('BOOKING_CONFIRM', 'email', data.customerEmail, 'Booking Confirmed', smsMessage, emailResult.success ? 'SENT' : 'FAILED', emailResult.error)
    results.push({ channel: 'email', ...emailResult })
  }

  return results
}

export async function sendCancellationAlert(data: BookingNotificationData & { refundAmount: number }) {
  const smsMessage = `CinePOS: Your booking ${data.bookingRef} has been cancelled. Refund of ₹${data.refundAmount} will be processed within 5-7 business days.`

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 24px; color: white; text-align: center;">
        <h1 style="margin: 0; color: #E8A020;">🎬 CinePOS</h1>
        <p style="margin: 8px 0 0; color: #aaa;">Booking Cancellation</p>
      </div>
      <div style="padding: 24px; background: #f8f8f8;">
        <div style="background: white; padding: 20px; border-radius: 12px;">
          <div style="color: #ef4444; font-size: 24px; margin-bottom: 12px;">⚠ Booking Cancelled</div>
          <p style="margin: 0 0 16px; color: #666;">Dear <strong>${data.customerName}</strong>, your booking has been cancelled.</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
            <p style="margin: 0 0 8px;"><strong>Booking Ref:</strong> ${data.bookingRef}</p>
            <p style="margin: 0 0 8px;"><strong>Movie:</strong> ${data.movieTitle}</p>
            <p style="margin: 0;"><strong>Refund Amount:</strong> <span style="color: #20C878;">₹${data.refundAmount}</span></p>
          </div>
          
          <p style="color: #666; margin-top: 16px;">Refund will be processed within 5-7 business days.</p>
        </div>
      </div>
    </div>
  `

  const results = []

  if (data.customerPhone) {
    const smsResult = await sendSMS({ to: data.customerPhone, message: smsMessage })
    await logNotification('CANCELLATION', 'sms', data.customerPhone, 'Booking Cancelled', smsMessage, smsResult.success ? 'SENT' : 'FAILED', smsResult.error)
    results.push({ channel: 'sms', ...smsResult })
  }

  if (data.customerEmail) {
    const emailResult = await sendEmail({
      to: data.customerEmail,
      subject: `CinePOS: Booking Cancelled - ${data.bookingRef}`,
      html: emailHtml,
    })
    await logNotification('CANCELLATION', 'email', data.customerEmail, 'Booking Cancelled', smsMessage, emailResult.success ? 'SENT' : 'FAILED', emailResult.error)
    results.push({ channel: 'email', ...emailResult })
  }

  return results
}

export async function sendShowReminder(data: BookingNotificationData) {
  const smsMessage = `CinePOS Reminder: Your movie "${data.movieTitle}" starts at ${data.showTime} today. Seats: ${data.seats.join(', ')}. Please arrive 15 mins early.`

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 24px; color: white; text-align: center;">
        <h1 style="margin: 0; color: #E8A020;">🎬 CinePOS</h1>
        <p style="margin: 8px 0 0; color: #aaa;">Show Reminder</p>
      </div>
      <div style="padding: 24px; background: #f8f8f8;">
        <div style="background: white; padding: 20px; border-radius: 12px;">
          <div style="color: #E8A020; font-size: 24px; margin-bottom: 12px;">🎬 Show Reminder</div>
          <p style="margin: 0 0 16px; color: #666;">Hi <strong>${data.customerName}</strong>, your show is starting soon!</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
            <p style="margin: 0 0 8px;"><strong>Movie:</strong> ${data.movieTitle}</p>
            <p style="margin: 0 0 8px;"><strong>Show Time:</strong> ${data.showTime}</p>
            <p style="margin: 0 0 8px;"><strong>Screen:</strong> ${data.screen}</p>
            <p style="margin: 0;"><strong>Seats:</strong> ${data.seats.join(', ')}</p>
          </div>
          
          <p style="color: #ef4444; margin-top: 16px;">⚠ Please arrive 15 minutes before the show starts</p>
        </div>
      </div>
    </div>
  `

  const results = []

  if (data.customerPhone) {
    const smsResult = await sendSMS({ to: data.customerPhone, message: smsMessage })
    await logNotification('REMINDER', 'sms', data.customerPhone, 'Show Reminder', smsMessage, smsResult.success ? 'SENT' : 'FAILED', smsResult.error)
    results.push({ channel: 'sms', ...smsResult })
  }

  if (data.customerEmail) {
    const emailResult = await sendEmail({
      to: data.customerEmail,
      subject: `CinePOS Reminder: ${data.movieTitle} at ${data.showTime}`,
      html: emailHtml,
    })
    await logNotification('REMINDER', 'email', data.customerEmail, 'Show Reminder', smsMessage, emailResult.success ? 'SENT' : 'FAILED', emailResult.error)
    results.push({ channel: 'email', ...emailResult })
  }

  return results
}