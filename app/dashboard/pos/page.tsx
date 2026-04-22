'use client'
// app/dashboard/pos/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Seat {
  id: string; row: string; number: number; type: 'VIP' | 'PREMIUM' | 'REGULAR'
  status: 'available' | 'booked' | 'locked'; price: number
}
interface Show {
  id: string; startTime: string; status: string
  priceVip: number; pricePremium: number; priceRegular: number
  movie: { title: string; format: string; duration: number; language: string }
  screen: { name: string; seats: Seat[]; theater: { name: string } }
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'UPI', label: 'UPI / QR', icon: '📱' },
  { value: 'CARD', label: 'Card', icon: '💳' },
  { value: 'WALLET', label: 'Wallet', icon: '👛' },
]

export default function POSPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const preselectedShowId = searchParams.get('showId')

  const [shows, setShows] = useState<Show[]>([])
  const [selectedShowId, setSelectedShowId] = useState<string>(preselectedShowId || '')
  const [showData, setShowData] = useState<Show | null>(null)
  const [loadingShow, setLoadingShow] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [timer, setTimer] = useState(300)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  const [step, setStep] = useState<'select' | 'checkout' | 'done'>('select')
  const [booking, setBooking] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ msg: string } | null>(null)

  const sessionId = useRef(
    typeof window !== 'undefined'
      ? (localStorage.getItem('cinepos-session') || (() => { const id = Math.random().toString(36).slice(2); localStorage.setItem('cinepos-session', id); return id })())
      : 'server'
  )

  // Load today's shows
  useEffect(() => {
    fetch('/api/shows?date=' + new Date().toISOString().slice(0, 10))
      .then(r => r.json())
      .then(d => {
        const active = (d.shows || []).filter((s: any) => s.status !== 'CANCELLED' && s.status !== 'COMPLETED')
        setShows(active)
        const initial = preselectedShowId || (active.length > 0 ? active[0].id : '')
        setSelectedShowId(initial)
      })
  }, [preselectedShowId])

  // Load show detail
  useEffect(() => {
    if (!selectedShowId) return
    setLoadingShow(true)
    setSelectedSeats([])
    setTimerActive(false)
    setTimer(300)
    if (timerRef.current) clearInterval(timerRef.current)
    fetch(`/api/shows/${selectedShowId}`)
      .then(r => r.json())
      .then(d => { setShowData(d.show); setLoadingShow(false) })
  }, [selectedShowId])

  // Poll seat status every 10s
  useEffect(() => {
    if (!selectedShowId || step === 'done') return
    const poll = setInterval(async () => {
      const res = await fetch(`/api/seats/status?showId=${selectedShowId}`)
      const data = await res.json()
      setShowData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          screen: {
            ...prev.screen,
            seats: prev.screen.seats.map(s => {
              if (selectedSeats.some(ss => ss.id === s.id)) return s
              if (data.booked?.includes(s.id)) return { ...s, status: 'booked' }
              if (data.locked?.[s.id] && data.locked[s.id].sessionId !== sessionId.current) return { ...s, status: 'locked' }
              return { ...s, status: 'available' }
            })
          }
        }
      })
    }, 10000)
    return () => clearInterval(poll)
  }, [selectedShowId, step, selectedSeats])

  // Timer countdown
  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setTimerActive(false)
          setSelectedSeats([])
          showToast('⏰ Seat lock expired. Please reselect.')
          return 300
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActive])

  function showToast(msg: string) {
    setToast({ msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function toggleSeat(seat: Seat) {
    if (seat.status === 'booked' || seat.status === 'locked') return
    const already = selectedSeats.find(s => s.id === seat.id)
    const newSeats = already ? selectedSeats.filter(s => s.id !== seat.id) : [...selectedSeats, seat]
    if (!already && selectedSeats.length >= 10) { showToast('Max 10 seats per booking'); return }
    setSelectedSeats(newSeats)

    if (newSeats.length > 0) {
      const res = await fetch('/api/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showId: selectedShowId, seatIds: newSeats.map(s => s.id), sessionId: sessionId.current }),
      })
      const data = await res.json()
      if (!data.success) { showToast('Seat just taken. Try another.'); setSelectedSeats(selectedSeats); return }
      setTimer(300); setTimerActive(true)
    } else {
      setTimerActive(false); setTimer(300)
      if (already) {
        await fetch('/api/seats/lock', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ showId: selectedShowId, seatIds: [seat.id], sessionId: sessionId.current }),
        })
      }
    }
  }

  async function validateCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    const total = selectedSeats.reduce((s, seat) => s + seat.price, 0)
    const res = await fetch('/api/coupons/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode.toUpperCase(), amount: total }),
    })
    const data = await res.json()
    setCouponLoading(false)
    if (data.valid) { setCouponDiscount(data.discount); setCouponMsg(`✓ Saved ₹${data.discount}`) }
    else { setCouponDiscount(0); setCouponMsg(data.error || 'Invalid coupon') }
  }

  async function confirmBooking() {
    setSubmitting(true); setError('')
    const res = await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        showId: selectedShowId, seatIds: selectedSeats.map(s => s.id),
        customerName, customerPhone, customerEmail,
        paymentMethod, couponCode: couponCode || undefined,
        channel: 'POS', sessionId: sessionId.current,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error || 'Booking failed'); return }
    setBooking(data.booking); setStep('done')
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerActive(false)
    showToast('✅ Booking confirmed!')
  }

  function resetBooking() {
    setSelectedSeats([]); setStep('select'); setBooking(null)
    setCustomerName(''); setCustomerPhone(''); setCustomerEmail('')
    setCouponCode(''); setCouponDiscount(0); setCouponMsg('')
    setTimer(300); setTimerActive(false)
  }

  const seatsByRow = showData
    ? showData.screen.seats.reduce((acc: Record<string, Seat[]>, s) => { (acc[s.row] = acc[s.row] || []).push(s); return acc }, {})
    : {}

  const total = selectedSeats.reduce((s, seat) => s + seat.price, 0)
  const finalAmount = Math.max(0, total - couponDiscount)
  const timerPct = (timer / 300) * 100
  const timerColor = timerPct < 20 ? 'var(--red)' : timerPct < 50 ? 'var(--accent)' : 'var(--green)'
  const tMins = Math.floor(timer / 60), tSecs = timer % 60

  if (step === 'done' && booking) {
    const seatLabels = booking.bookingSeats?.map((bs: any) => `${bs.seat.row}${bs.seat.number}`).join(', ')
    return (
      <div className="animate-fadeIn" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Booking Confirmed!</div>
        <div style={{ color: 'var(--muted)', marginBottom: 32 }}>Ticket issued successfully</div>
        <div className="cp-card" style={{ padding: 24, textAlign: 'left', marginBottom: 20 }}>
          {[['Booking Ref', booking.bookingRef],['Movie', booking.show?.movie?.title],
            ['Show Time', format(new Date(booking.show?.startTime), 'dd MMM yyyy, h:mm a')],
            ['Screen', booking.show?.screen?.name], ['Seats', seatLabels],
            ['Customer', booking.customerName || 'Walk-in'],
            ['Amount Paid', `₹${booking.finalAmount?.toLocaleString('en-IN')}`],
            ['Payment', booking.payment?.method],
          ].map(([l, v]) => (
            <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>{l}</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v as string}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`/api/bookings/${booking.bookingRef}/ticket`} target="_blank" rel="noreferrer" className="btn btn-primary">🖨️ Print Ticket</a>
          <button onClick={resetBooking} className="btn btn-ghost">+ New Booking</button>
          <button onClick={() => router.push('/dashboard/bookings')} className="btn btn-ghost">All Bookings</button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>POS Booking</div>
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>Walk-in ticket booking terminal</div>
      </div>

      {/* Show selector */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {shows.map(show => (
          <div key={show.id} onClick={() => { setSelectedShowId(show.id); setStep('select') }}
            style={{ background: selectedShowId === show.id ? 'var(--accent-dim)' : 'var(--card)', border: `1px solid ${selectedShowId === show.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: '10px 16px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', minWidth: 160 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{show.movie.title}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {format(new Date(show.startTime), 'h:mm a')} · {show.movie.format}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: selectedShowId === show.id ? 'var(--accent)' : 'var(--muted)', marginTop: 1 }}>{show.screen.name}</div>
          </div>
        ))}
        {shows.length === 0 && <div style={{ color: 'var(--muted)', padding: 16 }}>No shows available today</div>}
      </div>

      {loadingShow && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 28, height: 28 }}/></div>}

      {showData && !loadingShow && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20, alignItems: 'start' }}>
          {/* Seat Map / Checkout */}
          {step === 'select' ? (
            <div className="cp-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{showData.movie.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    {format(new Date(showData.startTime), 'h:mm a')} · {showData.movie.format} · {showData.screen.name}
                  </div>
                </div>
                <span className={`badge badge-${showData.status.toLowerCase()}`}>{showData.status}</span>
              </div>

              <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,var(--accent),transparent)', borderRadius: 2, marginBottom: 6 }}/>
              <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>SCREEN</div>

              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', minWidth: 'fit-content', margin: '0 auto' }}>
                  {Object.entries(seatsByRow).sort(([a], [b]) => a.localeCompare(b)).map(([row, seats]) => (
                    <div key={row} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      <span style={{ width: 16, textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)', flexShrink: 0 }}>{row}</span>
                      {(seats as Seat[]).sort((a, b) => a.number - b.number).map(seat => {
                        const isSel = selectedSeats.some(s => s.id === seat.id)
                        return (
                          <button key={seat.id} onClick={() => toggleSeat(seat)}
                            title={`${seat.row}${seat.number} · ${seat.type} · ₹${seat.price}`}
                            className={`seat-${isSel ? 'selected' : seat.status === 'available' ? seat.type.toLowerCase() : seat.status}`}
                            style={{ width: 22, height: 18, borderRadius: '4px 4px 2px 2px', border: 'none', fontSize: 0, cursor: seat.status !== 'available' && !isSel ? 'not-allowed' : 'pointer', transition: 'transform 0.1s', transform: isSel ? 'scale(1.15)' : 'scale(1)', flexShrink: 0 }}
                          />
                        )
                      })}
                      <span style={{ width: 16, textAlign: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)', flexShrink: 0 }}>{row}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
                {[['seat-vip', `VIP ₹${showData.priceVip}`], ['seat-premium', `Premium ₹${showData.pricePremium}`], ['seat-regular', `Regular ₹${showData.priceRegular}`], ['seat-booked', 'Booked'], ['seat-locked', 'Locked']].map(([cls, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                    <div className={cls} style={{ width: 14, height: 11, borderRadius: '3px 3px 1px 1px' }}/>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="cp-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button onClick={() => setStep('select')} className="btn btn-ghost btn-sm">← Back</button>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Customer & Payment</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
                {[['Customer Name', customerName, setCustomerName, 'Walk-in / Guest', 'text'], ['Mobile Number', customerPhone, setCustomerPhone, '+91 XXXXX XXXXX', 'tel'], ['Email (optional)', customerEmail, setCustomerEmail, 'email@example.com', 'email']].map(([label, val, setter, ph, type]) => (
                  <div key={label as string}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{label as string}</label>
                    <input className="cp-input" type={type as string} value={val as string} onChange={e => (setter as any)(e.target.value)} placeholder={ph as string}/>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                      style={{ background: paymentMethod === pm.value ? 'var(--accent-dim)' : 'var(--bg)', border: `1px solid ${paymentMethod === pm.value ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', color: paymentMethod === pm.value ? 'var(--accent)' : 'var(--muted)', fontSize: 13, fontWeight: 600, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {pm.icon} {pm.label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <button onClick={confirmBooking} disabled={submitting} className="btn btn-primary btn-lg btn-full">
                {submitting ? <><span className="spinner" style={{ marginRight: 8 }}/>Processing...</> : `✓ Confirm & Pay ₹${finalAmount.toLocaleString('en-IN')}`}
              </button>
            </div>
          )}

          {/* Summary Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {timerActive && (
              <div className="cp-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Seat lock expires</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: timerColor, fontSize: 14 }}>
                    {String(tMins).padStart(2,'0')}:{String(tSecs).padStart(2,'0')}
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${timerPct}%`, background: timerColor, borderRadius: 2, transition: 'width 1s linear' }}/>
                </div>
              </div>
            )}

            <div className="cp-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 14 }}>🎟️ Booking Summary</div>
              {selectedSeats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🪑</div>
                  <div style={{ fontSize: 13 }}>Select seats from the map</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {selectedSeats.map(s => (
                      <span key={s.id} onClick={() => toggleSeat(s)} style={{ background: 'var(--accent)', color: '#000', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4, cursor: 'pointer' }}>
                        {s.row}{s.number} ×
                      </span>
                    ))}
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    {selectedSeats.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)' }}>{s.row}{s.number} ({s.type})</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{s.price}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
                      {couponDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>
                          <span>Coupon Discount</span><span>-₹{couponDiscount}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)' }}>₹{finalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input className="cp-input" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponMsg('') }} placeholder="COUPON CODE" style={{ flex: 1, fontSize: 12 }}/>
                    <button onClick={validateCoupon} disabled={couponLoading} className="btn btn-ghost btn-sm">
                      {couponLoading ? <span className="spinner"/> : 'Apply'}
                    </button>
                  </div>
                  {couponMsg && <div style={{ fontSize: 12, marginBottom: 10, color: couponDiscount > 0 ? 'var(--green)' : 'var(--red)' }}>{couponMsg}</div>}
                  {step === 'select' && (
                    <button onClick={() => setStep('checkout')} className="btn btn-primary btn-full">Proceed to Checkout →</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="animate-slideIn" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200 }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
