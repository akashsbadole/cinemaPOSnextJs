'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function EventDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(data => {
        setEvent(data.event)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleBook = () => {
    if (!selectedTier) return alert('Please select a ticket tier')
    window.location.href = `/events/${id}/book?tier=${selectedTier}&qty=${quantity}`
  }

  if (loading) return <div style={{ padding: 40 }}>Loading event details...</div>
  if (!event) return <div style={{ padding: 40 }}>Event not found</div>

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const tiers = event.ticketTiers || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      {/* Back link */}
      <Link href="/events" style={{ color: 'var(--accent)', marginBottom: 24, display: 'inline-block' }}>
        ← Back to all events
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Left: Image and Info */}
        <div>
          {event.posterUrl ? (
            <img src={event.posterUrl} alt={event.title} style={{ width: '100%', borderRadius: 12, marginBottom: 24 }} />
          ) : (
            <div style={{ height: 300, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, marginBottom: 24 }}>🎟️</div>
          )}
          
          {/* Trailer Section */}
          {event.trailerUrl && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Watch Trailer</h3>
              <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
                <iframe
                  src={event.trailerUrl.replace('watch?v=', 'embed/')}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                />
              </div>
            </div>
          )}
          
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{event.title}</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            <span style={{ textTransform: 'capitalize' }}>{event.category}</span> • {event.eventType?.replace('_', ' ')} • {event.status}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, fontSize: 14 }}>
            <div>📅 {formatDate(event.startDate)} - {formatDate(event.endDate)}</div>
            <div>📍 {event.venue?.name}, {event.venue?.city}, {event.venue?.state}</div>
            <div>🏢 Organized by {event.organizer?.name}</div>
          </div>
          <div style={{ lineHeight: 1.6 }}>{event.description}</div>
        </div>

        {/* Right: Ticket Selection */}
        <div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Select Tickets</h2>

            {tiers.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No ticket tiers available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tiers.map((tier: any) => {
                  const isAvailable = tier.availableCount > 0
                  return (
                    <div
                      key={tier.id}
                      onClick={() => isAvailable && setSelectedTier(tier.id)}
                      style={{
                        border: selectedTier === tier.id ? '2px solid #E8A020' : '1px solid var(--border)',
                        borderRadius: 8,
                        padding: 16,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        opacity: isAvailable ? 1 : 0.6,
                        background: selectedTier === tier.id ? 'rgba(232,160,32,0.1)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{tier.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {tier.features?.length > 0 ? tier.features.map((f: any) => f.name).join(', ') : 'General admission'}
                          </div>
                          <div style={{ fontSize: 12 }}>
                            Available: {tier.availableCount} / {tier.totalCapacity}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#E8A020', fontSize: 18 }}>₹{tier.currentPrice}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Quantity (max 10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', marginBottom: 16 }}
              />
            </div>

            <button
              onClick={handleBook}
              disabled={!selectedTier}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 8,
                border: 'none',
                background: selectedTier ? '#E8A020' : 'var(--border)',
                color: '#000',
                fontWeight: 700,
                fontSize: 16,
                cursor: selectedTier ? 'pointer' : 'not-allowed',
              }}
            >
              Book Now
            </button>
          </div>

          {/* Event Details Summary */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Event Details</h3>
            <div style={{ display: 'grid', gap: 8, color: 'var(--muted)' }}>
              <div>⏰ {formatDate(event.startDate)}</div>
              <div>📍 {event.venue?.name}, {event.venue?.address}</div>
              <div>👥 Capacity: {event.capacity}</div>
              <div>🔁 Refund Policy: {event.refundPolicy}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section (basic) */}
      {event.reviews && event.reviews.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Reviews</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {event.reviews.map((review: any) => (
              <div key={review.id} style={{ background: 'var(--surface)', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{review.customer?.name || 'Anonymous'}</span>
                  <span style={{ color: '#E8A020' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
