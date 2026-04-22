'use client'
// app/dashboard/bookings/page.tsx
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [toast, setToast] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15' })
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (date) params.set('date', date)
    fetch(`/api/bookings?${params}`).then(r => r.json()).then(d => {
      setBookings(d.bookings || [])
      setTotal(d.total || 0)
      setPages(d.pages || 1)
      setLoading(false)
    })
  }

  useEffect(() => { setPage(1) }, [search, status, date])
  useEffect(() => { load() }, [page, search, status, date])

  const cancelBooking = async () => {
    if (!selected) return
    setCancelling(true)
    const res = await fetch(`/api/bookings/${selected.id}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: cancelReason, refundMethod: 'WALLET' }),
    })
    const data = await res.json()
    setCancelling(false)
    setShowCancel(false)
    setSelected(null)
    if (res.ok) showToast(`Cancelled. Refund: ₹${data.refundAmount}`)
    else showToast(data.error || 'Failed')
    load()
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000) }
  const openTicket = (b: any, format?: string) => {
    const url = format 
      ? `/api/bookings/${b.bookingRef}/ticket?format=${format}` 
      : `/api/bookings/${b.bookingRef}/ticket`
    window.open(url, '_blank')
  }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Bookings</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>{total} total bookings</div>
        </div>
      </div>

      {/* Filters */}
      <div className="cp-card" style={{ padding: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="cp-input" placeholder="🔍 Search by ref, name, phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }}/>
        <select className="cp-input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 150 }}>
          <option value="">All Status</option>
          {['CONFIRMED', 'PENDING', 'CANCELLED', 'REFUNDED'].map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="date" className="cp-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 160 }}/>
        {(search || status || date) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatus(''); setDate('') }}>Clear ×</button>
        )}
      </div>

      {/* Table */}
      <div className="cp-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer</th>
                  <th>Movie</th>
                  <th className="hide-mobile">Show Time</th>
                  <th>Seats</th>
                  <th>Amount</th>
                  <th className="hide-mobile">Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No bookings found</td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>{b.bookingRef}</span>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{format(new Date(b.createdAt), 'dd MMM · h:mm a')}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.customerName || 'Walk-in'}</div>
                      {b.customerPhone && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.customerPhone}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.show?.movie?.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.show?.screen?.name}</div>
                    </td>
                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {b.show?.startTime ? format(new Date(b.show.startTime), 'dd MMM · h:mm a') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 120 }}>
                        {b.bookingSeats?.slice(0, 4).map((bs: any) => (
                          <span key={bs.id} style={{ background: 'var(--subtle)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px', borderRadius: 3 }}>
                            {bs.seat?.row}{bs.seat?.number}
                          </span>
                        ))}
                        {b.bookingSeats?.length > 4 && <span style={{ fontSize: 10, color: 'var(--muted)' }}>+{b.bookingSeats.length - 4}</span>}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>₹{b.finalAmount?.toLocaleString('en-IN')}</td>
                    <td className="hide-mobile">
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{b.payment?.method}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${b.status.toLowerCase()}`}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}/>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openTicket(b)}>🎟️</button>
                          <select 
                            onChange={(e) => { if (e.target.value) openTicket(b, e.target.value) }}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            title="Download ticket"
                          >
                            <option value="">🎟️</option>
                            <option value="html">HTML</option>
                            <option value="pdf">PDF</option>
                            <option value="thermal">Thermal</option>
                          </select>
                        </div>
                        {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
                          <button className="btn btn-danger btn-sm" onClick={() => { setSelected(b); setCancelReason(''); setShowCancel(true) }}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
              {page} / {pages}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancel && selected && (
        <div className="modal-backdrop" onClick={() => setShowCancel(false)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Cancel Booking</div>
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', marginBottom: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selected.bookingRef}</div>
              <div style={{ color: 'var(--muted)' }}>{selected.show?.movie?.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', marginTop: 4 }}>₹{selected.finalAmount?.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ background: 'rgba(232,160,32,0.1)', border: '1px solid rgba(232,160,32,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--accent)', marginBottom: 16 }}>
              ⚠️ Refund: 100% if 60+ mins before show · 50% if within 1hr · No refund after show starts
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Reason</label>
              <input className="cp-input" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation..."/>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={cancelBooking} disabled={cancelling}>
                {cancelling ? <span className="spinner"/> : 'Confirm Cancel'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowCancel(false)}>Go Back</button>
            </div>
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
