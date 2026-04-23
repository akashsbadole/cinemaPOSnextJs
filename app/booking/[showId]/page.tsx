'use client'
// app/booking/[showId]/page.tsx
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BookingPage() {
  const { showId } = useParams()
  const [show, setShow] = useState<any>(null)
  const [seats, setSeats] = useState<any[]>([])
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [step, setStep] = useState(1) // 1: Seats, 2: Details/Payment
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [razorpaySettings, setRazorpaySettings] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      fetch(`/api/shows/${showId}`).then(r => r.json()),
      fetch(`/api/shows/${showId}/seats`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ]).then(([showData, seatsData, settings]) => {
      setShow(showData)
      setSeats(seatsData)
      setRazorpaySettings(settings)
      setLoading(false)
    })
  }, [showId])

  const toggleSeat = (id: string) => {
    if (selectedSeats.includes(id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== id))
    } else {
      setSelectedSeats([...selectedSeats, id])
    }
  }

  const totalPrice = selectedSeats.reduce((acc, sid) => {
    const seat = seats.find(s => s.id === sid)
    if (!seat) return acc
    if (seat.type === 'VIP') return acc + show.priceVip
    if (seat.type === 'PREMIUM') return acc + show.pricePremium
    return acc + show.priceRegular
  }, 0)

  async function handleBooking() {
    if (!guestDetails.email || !guestDetails.name) {
      alert('Please fill in your details')
      return
    }

    if (razorpaySettings?.RAZORPAY_ENABLED === 'true' && (window as any).Razorpay) {
      const options = {
        key: razorpaySettings.RAZORPAY_KEY_ID,
        amount: totalPrice * 100,
        currency: "INR",
        name: "CinePOS",
        description: `Booking for ${show.movie.title}`,
        handler: async function (response: any) {
          await createBooking(response.razorpay_payment_id)
        },
        prefill: {
          name: guestDetails.name,
          email: guestDetails.email,
          contact: guestDetails.phone
        },
        theme: {
          color: "#e8a020"
        }
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
      return
    }

    await createBooking()
  }

  async function createBooking(paymentId?: string) {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          seatIds: selectedSeats,
          customerName: guestDetails.name,
          customerEmail: guestDetails.email,
          customerPhone: guestDetails.phone,
          channel: 'WEB',
          paymentMethod: 'ONLINE',
          transactionId: paymentId
        })
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/booking/confirmation/${data.id}`)
      } else {
        alert(data.error || 'Booking failed')
      }
    } catch (err) {
      alert('Error creating booking')
    }
  }

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading seat map...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>{show.movie.title}</h1>
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>{show.screen.theater.name} • {new Date(show.startTime).toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ width: 40, height: 4, background: step >= s ? 'var(--accent)' : 'var(--border)', borderRadius: 2 }} />
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
            <div className="cp-card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '80%', height: 4, background: 'var(--border)', borderRadius: 4, marginBottom: 60, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>SCREEN THIS WAY</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Simplified seat map representation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 30px)', gap: 8 }}>
                  {seats.map(seat => {
                    const isSelected = selectedSeats.includes(seat.id)
                    const isBooked = seat.isBooked || seat.isLocked
                    return (
                      <div
                        key={seat.id}
                        onClick={() => !isBooked && toggleSeat(seat.id)}
                        style={{
                          width: 30, height: 30, borderRadius: 6, cursor: isBooked ? 'not-allowed' : 'pointer',
                          background: isBooked ? 'var(--border)' : isSelected ? 'var(--accent)' : 'var(--surface)',
                          border: '1px solid var(--border)',
                          fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? '#000' : 'var(--muted)'
                        }}
                      >
                        {seat.row}{seat.number}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 40, display: 'flex', gap: 24, fontSize: 12, color: 'var(--muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--border)' }} /> Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--accent)' }} /> Selected</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--border)' }} /> Booked</div>
              </div>
            </div>

            <div className="cp-card" style={{ padding: 24, height: 'fit-content' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Booking Summary</h3>
              {selectedSeats.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>No seats selected</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {selectedSeats.map(sid => {
                      const seat = seats.find(s => s.id === sid)
                      return <span key={sid} style={{ padding: '4px 8px', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{seat?.row}{seat?.number}</span>
                    })}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--muted)', fontSize: 14 }}>Tickets ({selectedSeats.length})</span>
                      <span style={{ fontWeight: 600 }}>₹{totalPrice}</span>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-full" onClick={() => setStep(2)}>Confirm Seats</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="cp-card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Guest Checkout</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Full Name</label>
                  <input
                    className="cp-input"
                    placeholder="John Doe"
                    value={guestDetails.name}
                    onChange={e => setGuestDetails({...guestDetails, name: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Email Address</label>
                  <input
                    className="cp-input"
                    type="email"
                    placeholder="john@example.com"
                    value={guestDetails.email}
                    onChange={e => setGuestDetails({...guestDetails, email: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Phone Number</label>
                  <input
                    className="cp-input"
                    placeholder="+91 98765 43210"
                    value={guestDetails.phone}
                    onChange={e => setGuestDetails({...guestDetails, phone: e.target.value})}
                  />
                </div>

                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 12, marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Total Amount</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>

                <button className="btn btn-primary btn-full" onClick={handleBooking} style={{ marginTop: 12 }}>
                  Pay & Book Tickets
                </button>
                <button className="btn btn-ghost btn-full" onClick={() => setStep(1)}>Back to Seats</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
