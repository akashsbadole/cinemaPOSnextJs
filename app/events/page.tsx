'use client'
import { useState, useEffect } from 'react'
import EventCard from '@/components/event-card'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    fetchEvents()
  }, [filters])

  const fetchEvents = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.category) params.append('category', filters.category)
    if (filters.search) params.append('search', filters.search)
    if (filters.minPrice) params.append('minPrice', filters.minPrice)
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
    if (filters.dateFrom) params.append('startAfter', filters.dateFrom)
    if (filters.dateTo) params.append('startBefore', filters.dateTo)

    try {
      const res = await fetch(`/api/events?${params}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Failed to fetch events', err)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['CONCERT', 'SPORTS', 'CONFERENCE', 'FESTIVAL', 'THEATER', 'COMEDY']

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Explore Events</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16 }}>Discover concerts, sports, conferences and more</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search events..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 8, minWidth: 200 }}
        />
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 8 }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => updateFilter('dateFrom', e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 8 }}
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => updateFilter('dateTo', e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 8 }}
        />
        <input
          type="number"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(e) => updateFilter('minPrice', e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 8, width: 120 }}
        />
        <input
          type="number"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => updateFilter('maxPrice', e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 8, width: 120 }}
        />
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>No events found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {events.map((event: any) => {
            // Compute price range from tiers
            const prices = event.ticketTiers?.map((t: any) => t.currentPrice) || []
            const priceRange = prices.length > 0 ? `₹${Math.min(...prices)}${prices.length > 1 ? ` - ₹${Math.max(...prices)}` : ''}` : 'Free'
            return (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                description={event.description}
                category={event.category}
                startDate={event.startDate}
                venueName={event.venue?.name}
                posterUrl={event.posterUrl}
                priceRange={priceRange}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
