'use client'
import Link from 'next/link'

interface EventCardProps {
  id: string
  title: string
  description?: string | null
  category: string
  startDate: string
  venueName?: string
  city?: string
  country?: string
  posterUrl?: string | null
  priceRange?: string // e.g., "₹200 - ₹1000"
}

export default function EventCard({ id, title, description, category, startDate, venueName, city, country, posterUrl, priceRange }: EventCardProps) {
  const formattedDate = new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="cp-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => window.location.href = `/events/${id}`}>
      {posterUrl ? (
        <img src={posterUrl} alt={title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
      ) : (
        <div style={{ height: 180, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎟️</div>
      )}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{ background: '#E8A020', color: '#000', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{category}</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>{title}</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{formattedDate} {venueName ? `• ${venueName}` : ''} {city ? `• ${city}` : ''} {country ? `, ${country}` : ''}</p>
        {description && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p>}
        {priceRange && (
          <div style={{ marginTop: 8, fontWeight: 600, color: '#E8A020' }}>{priceRange}</div>
        )}
      </div>
    </div>
  )
}
