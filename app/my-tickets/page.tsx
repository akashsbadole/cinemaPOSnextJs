'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/my-tickets')
      .then(r => {
        if (r.status === 401) {
          window.location.href = '/login'
          return
        }
        return r.json()
      })
      .then(data => {
        if (data) setBookings(data.bookings || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading your tickets...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      <Link href="/events" style={{ color: 'var(--accent)', marginBottom: 24, display: 'inline-block' }}>
        ← Browse more events
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>My Tickets</h1>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface)', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No tickets yet</h3>
          <p style={{ color: 'var(--muted)' }}>Explore events and book your tickets!</p>
          <Link href="/events" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#E8A020', color: '#000', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
            Explore Events
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {bookings.map((booking) => (
            <div key={booking.bookingRef} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    background: booking.status === 'CONFIRMED' ? '#20C878' : booking.status === 'PENDING' ? '#E8A020' : '#ef4444',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {booking.status}
                  </span>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{booking.event.title}</h3>
                </div>
                <p style={{ color: 'var(--muted)', marginBottom: 8 }}>
                  📅 {new Date(booking.event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(booking.event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  <br />
                  📍 {booking.event.venue}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {booking.tickets.map((ticket: any) => (
                    <div key={ticket.ticketNumber} style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{ticket.ticketNumber}</div>
                      <div>{ticket.ticketTier}</div>
                      <div style={{ color: ticket.status === 'ACTIVE' ? '#20C878' : ticket.status === 'USED' ? '#666' : '#ef4444', fontSize: 10 }}>
                        {ticket.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#E8A020', marginBottom: 8 }}>₹{booking.totalAmount}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                  Ref: {booking.bookingRef}
                </div>
                {booking.payment && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Paid via {booking.payment.method}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
