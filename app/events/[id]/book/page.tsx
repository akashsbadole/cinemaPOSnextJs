'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function BookingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = params.id as string
  const tierId = searchParams.get('tier') || ''
  const initialQty = parseInt(searchParams.get('qty') || '1')

  const [event, setEvent] = useState<any>(null)
  const [tier, setTier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [cancellationProtect, setCancellationProtect] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    paymentMethod: 'CASH' as 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'ONLINE',
    couponCode: '',
    quantity: initialQty,
  })
  const [total, setTotal] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [final, setFinal] = useState(0)

  const cancellationProtectFee = settings?.CANCELLATION_PROTECT_FEE ? parseFloat(settings.CANCELLATION_PROTECT_FEE) : 25
  const cancellationProtectEnabled = settings?.CANCELLATION_PROTECT_ENABLED === 'true'

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/${id}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([eventData, settingsData]) => {
      setEvent(eventData.event)
      const foundTier = eventData.event.ticketTiers?.find((t: any) => t.id === tierId)
      setTier(foundTier || null)
      setSettings(settingsData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id, tierId])

  useEffect(() => {
    if (!tier) return
    const base = tier.currentPrice * form.quantity
    let disc = 0
    if (form.couponCode?.toUpperCase() === 'EVENT10') {
      disc = base * 0.1
    }
    setTotal(base)
    setDiscount(disc)
    const withProtect = cancellationProtect ? base - disc + cancellationProtectFee : base - disc
    setFinal(Math.max(0, withProtect))
  }, [tier, form.quantity, form.couponCode, cancellationProtect])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!tier) return
    if (!form.customerName || !form.customerPhone) {
      alert('Please fill in your name and phone number')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          tierId: tier.id,
          quantity: form.quantity,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          paymentMethod: form.paymentMethod,
          couponCode: form.couponCode || undefined,
          cancellationProtect,
          cancellationProtectFee: cancellationProtect ? cancellationProtectFee : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Booking failed')
      }
      router.push(`/my-tickets?bookingRef=${data.booking.bookingRef}`)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Loading booking details...</div>
  if (!event || !tier) return <div style={{ padding: 40 }}>Invalid event or tier</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      <Link href={`/events/${id}`} style={{ color: 'var(--accent)', marginBottom: 24, display: 'inline-block' }}>
        ← Back to event
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Order Summary */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Order Summary</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            {event.posterUrl ? (
              <img src={event.posterUrl} alt={event.title} style={{ width: 100, height: 140, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 100, height: 140, background: '#1a1a2e', borderRadius: 8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🎟️</div>
            )}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{event.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{event.category}</div>
              <div style={{ fontSize: 12 }}>{new Date(event.startDate).toLocaleDateString('en-IN')} at {new Date(event.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Venue: {event.venue?.name}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Tier</span>
              <span style={{ fontWeight: 600 }}>{tier.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Price</span>
              <span>₹{tier.currentPrice} × {form.quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Subtotal</span>
              <span>₹{total}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#20C878' }}>
                <span>Discount</span>
                <span>- ₹{discount}</span>
              </div>
            )}
            {cancellationProtectEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--accent)' }}>Cancellation Protect</span>
                <span style={{ fontWeight: 600 }}>₹{cancellationProtectFee}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
              <span>Total</span>
              <span style={{ color: '#E8A020' }}>₹{final}</span>
            </div>
          </div>
        </div>

        {/* Customer Details Form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Full Name *</label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Enter your name"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Email (optional)</label>
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                placeholder="your@email.com"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Phone Number *</label>
              <input
                type="tel"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Payment Method</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="WALLET">Wallet</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Promo Code (optional)</label>
              <input
                type="text"
                name="couponCode"
                value={form.couponCode}
                onChange={handleChange}
                placeholder="Try EVENT10 for 10% off"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            {cancellationProtectEnabled && (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={cancellationProtect}
                    onChange={(e) => setCancellationProtect(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Add Cancellation Protect</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Cancel anytime for {settings?.CANCELLATION_PROTECT_REFUND_PERCENT || 80}% refund
                    </div>
                  </div>
                </label>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 8,
                border: 'none',
                background: submitting ? '#ccc' : '#E8A020',
                color: '#000',
                fontWeight: 700,
                fontSize: 16,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Processing...' : `Pay ₹${final}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
