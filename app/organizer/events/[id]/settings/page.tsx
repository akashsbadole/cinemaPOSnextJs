'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function OrganizerEventSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'CONCERT',
    eventType: 'Single-day',
    posterUrl: '',
    bannerUrl: '',
    trailerUrl: '',
    refundPolicy: 'Full',
    capacity: 100,
  })
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.event) {
          setEvent(data.event)
          setForm({
            title: data.event.title || '',
            description: data.event.description || '',
            category: data.event.category || 'CONCERT',
            eventType: data.event.eventType || 'Single-day',
            posterUrl: data.event.posterUrl || '',
            bannerUrl: data.event.bannerUrl || '',
            trailerUrl: data.event.trailerUrl || '',
            refundPolicy: data.event.refundPolicy || 'Full',
            capacity: data.event.capacity || 100,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const save = async () => {
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError('')
    
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setSaving(false)
      
      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }
      
      setToast('Event updated successfully')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setSaving(false)
      setError('Error saving event')
    }
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (!event) return <div style={{ padding: 40 }}>Event not found</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800 }}>Event Settings</h1>
          <button 
            onClick={() => router.push('/organizer/events')}
            style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}
          >
            ← Back to Events
          </button>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Event Title *
              </label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="CONCERT">Concert</option>
                  <option value="SPORTS">Sports</option>
                  <option value="CONFERENCE">Conference</option>
                  <option value="FESTIVAL">Festival</option>
                  <option value="THEATER">Theater</option>
                  <option value="COMEDY">Comedy</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Event Type
                </label>
                <select
                  value={form.eventType}
                  onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="Single-day">Single-day</option>
                  <option value="Multi-day">Multi-day</option>
                  <option value="Recurring">Recurring</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Trailer URL (YouTube)
              </label>
              <input
                value={form.trailerUrl}
                onChange={e => setForm(f => ({ ...f, trailerUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Enter YouTube video URL to show trailer on event page</p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Poster Image URL
              </label>
              <input
                value={form.posterUrl}
                onChange={e => setForm(f => ({ ...f, posterUrl: e.target.value }))}
                placeholder="https://example.com/poster.jpg"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Banner Image URL
              </label>
              <input
                value={form.bannerUrl}
                onChange={e => setForm(f => ({ ...f, bannerUrl: e.target.value }))}
                placeholder="https://example.com/banner.jpg"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Capacity
                </label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Refund Policy
                </label>
                <select
                  value={form.refundPolicy}
                  onChange={e => setForm(f => ({ ...f, refundPolicy: e.target.value }))}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="Full">Full Refund</option>
                  <option value="Partial">Partial Refund</option>
                  <option value="None">No Refund</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '12px 16px', color: '#e84040' }}>
                {error}
              </div>
            )}

            <button
              onClick={save}
              disabled={saving}
              style={{
                marginTop: 8,
                padding: 14,
                borderRadius: 8,
                border: 'none',
                background: saving ? 'var(--border)' : '#E8A020',
                color: '#000',
                fontWeight: 700,
                fontSize: 16,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {toast && (
          <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--card)',
            border: '1px solid var(--green)',
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 200,
          }}>
            ✅ {toast}
          </div>
        )}
      </div>
    </div>
  )
}