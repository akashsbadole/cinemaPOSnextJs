'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellationProtect, setCancellationProtect] = useState(false)
  const [cancelling, setCancelling] = useState(false)

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

  const canCancelBooking = (booking: any) => {
    if (booking.status !== 'CONFIRMED') return false
    const eventStart = new Date(booking.event.startDate)
    const now = new Date()
    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilEvent > 2 // Allow cancellation up to 2 hours before event
  }

  const calculateRefund = (booking: any) => {
    const eventStart = new Date(booking.event.startDate)
    const now = new Date()
    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    let refundPercentage = 0
    if (hoursUntilEvent > 24) refundPercentage = 1.0 // Full refund
    else if (hoursUntilEvent > 6) refundPercentage = 0.8 // 80% refund
    else if (hoursUntilEvent > 2) refundPercentage = 0.5 // 50% refund

    if (cancellationProtect) {
      refundPercentage -= 0.1 // 10% fee for cancellation protection
    }

    return Math.max(0, booking.totalAmount * refundPercentage)
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason,
          cancellationProtect,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        // Update booking status in local state
        setBookings(bookings.map(b =>
          b.id === selectedBooking.id
            ? { ...b, status: 'CANCELLED' }
            : b
        ))
        setShowCancelModal(false)
        setSelectedBooking(null)
        alert(`Booking cancelled. Refund amount: ₹${data.refundAmount}`)
      } else {
        alert(data.error || 'Cancellation failed')
      }
    } catch (err) {
      alert('Error cancelling booking')
    } finally {
      setCancelling(false)
    }
  }

  const openCancelModal = (booking: any) => {
    setSelectedBooking(booking)
    setCancelReason('')
    setCancellationProtect(false)
    setShowCancelModal(true)
  }

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
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                    Paid via {booking.payment.method}
                  </div>
                )}
                {canCancelBooking(booking) && (
                  <button
                    onClick={() => openCancelModal(booking)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Cancel Booking</h2>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                {selectedBooking.event.title}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                {new Date(selectedBooking.event.startDate).toLocaleDateString()} at {new Date(selectedBooking.event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Total Paid:</span>
                <span style={{ fontWeight: 600 }}>₹{selectedBooking.totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Refund Amount:</span>
                <span style={{ fontWeight: 600, color: '#20C878' }}>₹{calculateRefund(selectedBooking)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                Reason for cancellation (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                }}
              >
                <option value="">Select reason</option>
                <option value="CHANGE_OF_PLANS">Change of plans</option>
                <option value="UNEXPECTED_EMERGENCY">Unexpected emergency</option>
                <option value="DOUBLE_BOOKING">Double booking</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={cancellationProtect}
                  onChange={(e) => setCancellationProtect(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 14 }}>
                  Add Cancellation Protect (+₹{Math.round(selectedBooking.totalAmount * 0.1)}) for flexible cancellation
                </span>
              </label>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Cancellation Protect allows you to cancel up to 2 hours before the event for a small fee.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                style={{
                  flex: 1,
                  padding: 12,
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: 12,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
