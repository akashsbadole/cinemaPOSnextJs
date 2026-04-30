'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/organizer/events')
      .then(r => r.json())
      .then(data => setEvents(data.events || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Your Events</h1>
        <Link href="/events/new" style={{ padding: '10px 20px', background: '#E8A020', color: '#000', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>
          + Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface)', borderRadius: 12 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No events yet</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Start creating your first event and sell tickets.</p>
          <Link href="/events/new" style={{ color: 'var(--accent)' }}>Create Event</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {events.map((event) => (
            <div key={event.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{event.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {new Date(event.startDate).toLocaleDateString('en-IN')} • {event.venue?.name}, {event.venue?.city} • Status: {event.status}
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  {event.ticketTiers?.map((t: any) => (
                    <span key={t.id} style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: 4, marginRight: 8, border: '1px solid var(--border)' }}>
                      {t.name}: ₹{t.currentPrice} ({t.soldCount}/{t.totalCapacity})
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/organizer/events/${event.id}/analytics`} style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, textDecoration: 'none', color: 'var(--text)' }}>
                  Analytics
                </Link>
                <Link href={`/organizer/events/${event.id}/settings`} style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, textDecoration: 'none', color: 'var(--text)' }}>
                  Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
