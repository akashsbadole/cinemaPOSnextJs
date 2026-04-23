'use client'
// app/booking/confirmation/[id]/page.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ConfirmationPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bookings/${id}`).then(r => r.json()).then(data => {
      setBooking(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading booking details...</div>
  if (!booking) return <div style={{ padding: 50, textAlign: 'center' }}>Booking not found</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="cp-card animate-fadeIn" style={{ maxWidth: 500, width: '100%', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Booking Confirmed!</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Your tickets have been booked successfully. A confirmation has been sent to your email.</p>

        <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 24, textAlign: 'left', marginBottom: 32, border: '1px dashed var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Booking Reference</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginBottom: 20 }}>{booking.bookingRef}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Movie</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{booking.show.movie.title}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Date & Time</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(booking.show.startTime).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Theater</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{booking.show.screen.theater.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Seats</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {booking.bookingSeats.map((bs: any) => `${bs.seat.row}${bs.seat.number}`).join(', ')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/" className="btn btn-ghost btn-full">Back to Home</Link>
          <button onClick={() => window.print()} className="btn btn-primary btn-full">Print Ticket</button>
        </div>
      </div>
    </div>
  )
}
