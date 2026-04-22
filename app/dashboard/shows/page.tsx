'use client'
// app/dashboard/shows/page.tsx
import { useEffect, useState } from 'react'
import { format, addDays, startOfDay } from 'date-fns'

export default function ShowsPage() {
  const [shows, setShows] = useState<any[]>([])
  const [movies, setMovies] = useState<any[]>([])
  const [theaters, setTheaters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ movieId: '', screenId: '', startTime: '', priceVip: 800, pricePremium: 450, priceRegular: 250 })
  const [screens, setScreens] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [selectedTheaterId, setSelectedTheaterId] = useState('')

  const loadShows = () => {
    setLoading(true)
    fetch(`/api/shows?date=${date}`).then(r => r.json()).then(d => { setShows(d.shows || []); setLoading(false) })
  }

  useEffect(() => { loadShows() }, [date])

  useEffect(() => {
    Promise.all([
      fetch('/api/movies?active=true').then(r => r.json()),
      fetch('/api/theaters').then(r => r.json()),
    ]).then(([m, t]) => {
      setMovies(m.movies || [])
      setTheaters(t.theaters || [])
      if (t.theaters?.length) setSelectedTheaterId(t.theaters[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedTheaterId) return
    const t = theaters.find(t => t.id === selectedTheaterId)
    setScreens(t?.screens || [])
    if (t?.screens?.length) setForm(f => ({ ...f, screenId: t.screens[0].id }))
  }, [selectedTheaterId, theaters])

  const openAdd = () => {
    const dt = new Date(date + 'T10:00')
    setForm({ movieId: movies[0]?.id || '', screenId: screens[0]?.id || '', startTime: format(dt, "yyyy-MM-dd'T'HH:mm"), priceVip: 800, pricePremium: 450, priceRegular: 250 })
    setError('')
    setModal(true)
  }

  const save = async () => {
    if (!form.movieId || !form.screenId || !form.startTime) { setError('All fields required'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Failed'); return }
    setModal(false)
    showToast('Show scheduled!')
    loadShows()
  }

  const cancelShow = async (id: string) => {
    if (!confirm('Cancel this show?')) return
    await fetch(`/api/shows/${id}`, { method: 'DELETE' })
    showToast('Show cancelled')
    loadShows()
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const quickDateBtn = (offset: number, label: string) => (
    <button key={label} className={`btn btn-sm ${date === format(addDays(new Date(), offset), 'yyyy-MM-dd') ? 'btn-primary' : 'btn-ghost'}`}
      onClick={() => setDate(format(addDays(new Date(), offset), 'yyyy-MM-dd'))}>
      {label}
    </button>
  )

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Shows</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>Schedule and manage screenings</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Schedule Show</button>
      </div>

      {/* Date Picker */}
      <div className="cp-card" style={{ padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[[-1, 'Yesterday'], [0, 'Today'], [1, 'Tomorrow'], [2, 'Day +2']].map(([o, l]) => quickDateBtn(o as number, l as string))}
        <input type="date" className="cp-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }}/>
        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
          {shows.length} show{shows.length !== 1 ? 's' : ''} on {format(new Date(date + 'T12:00'), 'dd MMM yyyy')}
        </span>
      </div>

      {/* Timeline view */}
      <div className="cp-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          📅 Show Schedule — {format(new Date(date + 'T12:00'), 'EEEE, dd MMMM yyyy')}
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
        ) : shows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            No shows scheduled for this date
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Screen</th>
                  <th>Start</th>
                  <th>End</th>
                  <th className="hide-mobile">Format</th>
                  <th>Occupancy</th>
                  <th className="hide-mobile">Revenue</th>
                  <th>VIP / Prem / Reg</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.map(show => {
                  const pct = show.occupancyPct || 0
                  const col = pct > 80 ? 'var(--green)' : pct > 50 ? 'var(--accent)' : 'var(--blue)'
                  const revenue = show.bookings?.reduce((s: number, b: any) => s + (b.finalAmount || 0), 0) || 0
                  return (
                    <tr key={show.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{show.movie?.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{show.screen?.theater?.name}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{show.screen?.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{format(new Date(show.startTime), 'h:mm a')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{format(new Date(show.endTime), 'h:mm a')}</td>
                      <td className="hide-mobile">
                        <span style={{ background: 'var(--subtle)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{show.movie?.format}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ height: 4, width: 60, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 2 }}/>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: col }}>{pct}%</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{show.bookedCount}/{show.totalSeats}</div>
                      </td>
                      <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>₹{revenue.toLocaleString('en-IN')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>₹{show.priceVip} / ₹{show.pricePremium} / ₹{show.priceRegular}</td>
                      <td><span className={`badge badge-${show.status.toLowerCase()}`}>{show.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {show.status !== 'CANCELLED' && show.status !== 'COMPLETED' && (
                            <button className="btn btn-danger btn-sm" onClick={() => cancelShow(show.id)}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Show Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Schedule New Show</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Movie *</label>
                <select className="cp-input" value={form.movieId} onChange={e => setForm(f => ({ ...f, movieId: e.target.value }))}>
                  <option value="">Select a movie</option>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.format} · {m.duration}m)</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Theater</label>
                <select className="cp-input" value={selectedTheaterId} onChange={e => setSelectedTheaterId(e.target.value)}>
                  {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Screen *</label>
                <select className="cp-input" value={form.screenId} onChange={e => setForm(f => ({ ...f, screenId: e.target.value }))}>
                  {screens.map(s => <option key={s.id} value={s.id}>{s.name} ({s._count?.seats || s.totalSeats} seats)</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Start Time *</label>
                <input className="cp-input" type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[['VIP Price ₹', 'priceVip'], ['Premium ₹', 'pricePremium'], ['Regular ₹', 'priceRegular']].map(([lbl, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{lbl}</label>
                    <input className="cp-input" type="number" min={1} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}/>
                  </div>
                ))}
              </div>
              {error && <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '8px 12px', color: 'var(--red)', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                  {saving ? <span className="spinner"/> : 'Schedule Show'}
                </button>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              </div>
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
