'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function OrganizerDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
  })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/organizer/dashboard')
      .then(r => r.json())
      .then(data => {
        if (data.stats) setStats(data.stats)
        if (data.recentEvents) setRecentEvents(data.recentEvents)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>Organizer Dashboard</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#E8A020' }}>{stats.totalEvents}</div>
              <div style={{ color: 'var(--muted)' }}>Total Events</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#E8A020' }}>{stats.totalBookings}</div>
              <div style={{ color: 'var(--muted)' }}>Total Bookings</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#E8A020' }}>₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
              <div style={{ color: 'var(--muted)' }}>Total Revenue</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#E8A020' }}>{stats.upcomingEvents}</div>
              <div style={{ color: 'var(--muted)' }}>Upcoming Events</div>
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Your Events</h2>
              <Link href="/organizer/events" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                Manage Events →
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, textAlign: 'center', color: 'var(--muted)' }}>
                No events created yet. <Link href="/organizer/events" style={{ color: 'var(--accent)' }}>Create your first event</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {recentEvents.map((ev: any) => (
                  <div key={ev.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{ev.title}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                        {new Date(ev.startDate).toLocaleDateString('en-IN')} • {ev.status}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#E8A020' }}>₹{ev._count?.bookings || 0} Bookings</div>
                      <div style={{ color: 'var(--muted)', fontSize: 12 }}>Revenue: ₹{ev.totalRevenue?.toLocaleString('en-IN') || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
