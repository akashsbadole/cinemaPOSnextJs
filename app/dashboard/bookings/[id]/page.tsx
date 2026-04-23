'use client'
// app/dashboard/bookings/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setBooking(d.booking)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [id])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  const openTicket = (format?: string) => {
    if (!booking) return
    const url = format ? `/api/bookings/${booking.bookingRef}/ticket?format=${format}` : `/api/bookings/${booking.bookingRef}/ticket`
    window.open(url, '_blank')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
  if (error) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--red)' }}>{error}</div>
  if (!booking) return null

  const seatLabels = booking.bookingSeats?.map((bs: any) => `${bs.seat.row}${bs.seat.number}`).join(', ')
  const foodItems = booking.bookingItems || []
  const foodTotal = foodItems.reduce((sum: number, bi: any) => sum + bi.price * bi.quantity, 0)

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/dashboard/bookings')} className="btn btn-ghost btn-sm">← Back</button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Booking Details</div>
        <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
      </div>

      {/* Main info card */}
      <div className="cp-card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{booking.bookingRef}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {format(new Date(booking.createdAt), 'dd MMM yyyy · h:mm a')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => openTicket()} className="btn btn-primary btn-sm">🎟️ Print Ticket</button>
            <div style={{ position: 'relative' }}>
              <select
                onChange={(e) => { if (e.target.value) openTicket(e.target.value) }}
                className="btn btn-ghost btn-sm"
                style={{ cursor: 'pointer' }}
              >
                <option value="">📄 More Formats</option>
                <option value="html">HTML</option>
                <option value="pdf">PDF</option>
                <option value="thermal">Thermal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Movie info */}
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{booking.show?.movie?.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {booking.show?.movie?.format} · {booking.show?.movie?.language}
          </div>
          {booking.show?.movie?.genre && (
            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>Genre: {booking.show?.movie?.genre} · Duration: {booking.show?.movie?.duration} min</div>
          )}
        </div>

        {/* Show details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 16 }}>
          {[
            ['Booking Date', format(new Date(booking.show?.startTime), 'dd MMM yyyy')],
            ['Show Time', format(new Date(booking.show?.startTime), 'h:mm a')],
            ['Screen', booking.show?.screen?.name || '—'],
            ['Theater', booking.show?.screen?.theater?.name || '—'],
          ].map(([l, v]) => (
            <div key={l as string}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{v as string}</div>
            </div>
          ))}
        </div>

        {/* Customer info */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Customer</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            {[
              ['Name', booking.customerName || 'Walk-in'],
              ['Phone', booking.customerPhone || '—'],
              ['Email', booking.customerEmail || '—'],
              ['Channel', booking.channel || 'POS'],
            ].map(([l, v]) => (
              <div key={l as string}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13 }}>{v as string}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seats & Food cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Seats */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>🎟️ Seats ({booking.bookingSeats?.length || 0})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {booking.bookingSeats?.map((bs: any) => (
              <span key={bs.id} style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 4 }}>
                {bs.seat.row}{bs.seat.number}
              </span>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            {booking.bookingSeats?.map((bs: any) => (
              <div key={bs.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                <span style={{ color: 'var(--muted)' }}>{bs.seat.row}{bs.seat.number} ({bs.seat.type})</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{bs.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Food */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>🍿 Food & Beverages ({foodItems.length})</div>
          {foodItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>🍿</div>
              <div style={{ fontSize: 12 }}>No food items</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                {foodItems.map((bi: any) => (
                  <div key={bi.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>{bi.foodItem?.name} ×{bi.quantity}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{bi.price * bi.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                Food Subtotal: ₹{foodTotal}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment & Totals */}
      <div className="cp-card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>💳 Payment</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 16 }}>
          {[
            ['Method', booking.payment?.method || '—'],
            ['Status', booking.payment?.status || '—'],
            ['Transaction ID', booking.payment?.transactionId || '—'],
          ].map(([l, v]) => (
            <div key={l as string}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{v as string}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>Seats ({booking.bookingSeats?.length})</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>₹{booking.bookingSeats?.reduce((s: number, bs: any) => s + bs.price, 0)}</span>
          </div>
          {foodItems.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>Food & Beverages</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>₹{foodTotal}</span>
            </div>
          )}
          {booking.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: 'var(--green)' }}>
              <span>Discount</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>-₹{booking.discountAmount}</span>
            </div>
          )}
          <div style={{ borderTop: '2px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total Paid</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>₹{booking.finalAmount?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="cp-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Notes</div>
          <div style={{ fontSize: 13 }}>{booking.notes}</div>
        </div>
      )}

      {/* Cancellation */}
      {booking.cancellation && (
        <div className="cp-card" style={{ padding: 16, border: '1px solid rgba(232,64,64,0.3)', background: 'rgba(232,64,64,0.05)' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--red)' }}>Cancellation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, fontSize: 13 }}>
            {[
              ['Reason', booking.cancellation.reason || '—'],
              ['Status', booking.cancellation.status],
              ['Refund Amount', `₹${booking.cancellation.refundAmount}`],
              ['Refund Method', booking.cancellation.refundMethod],
              ['Cancelled At', booking.cancellation.cancelledAt ? format(new Date(booking.cancellation.cancelledAt), 'dd MMM yyyy · h:mm a') : '—'],
            ].map(([l, v]) => (
              <div key={l as string}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{l}</div>
                <div>{v as string}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="animate-slideIn" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--card)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, zIndex: 200 }}>
          ✅ {toast}
        </div>
      )}
    </div>
  )
}