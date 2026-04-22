'use client'
// app/dashboard/theaters/page.tsx
import { useEffect, useState } from 'react'

export default function TheatersPage() {
  const [theaters, setTheaters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'theater' | 'screen' | null>(null)
  const [selectedTheater, setSelectedTheater] = useState<any>(null)
  const [form, setForm] = useState({ name: '', location: '', address: '', phone: '', email: '' })
  const [screenForm, setScreenForm] = useState({
    name: '',
    seatLayout: [
      { row: 'A', count: 10, type: 'VIP' },
      { row: 'B', count: 10, type: 'VIP' },
      { row: 'C', count: 12, type: 'PREMIUM' },
      { row: 'D', count: 12, type: 'PREMIUM' },
      { row: 'E', count: 14, type: 'REGULAR' },
      { row: 'F', count: 14, type: 'REGULAR' },
    ],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = () => { setLoading(true); fetch('/api/theaters').then(r => r.json()).then(d => { setTheaters(d.theaters || []); setLoading(false) }) }
  useEffect(() => { load() }, [])

  const addTheater = async () => {
    setSaving(true); setError('')
    const res = await fetch('/api/theaters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setModal(null); showToast('Theater added!'); load()
  }

  const addScreen = async () => {
    if (!selectedTheater) return
    setSaving(true); setError('')
    const res = await fetch(`/api/theaters/${selectedTheater.id}/screens`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(screenForm) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setModal(null); showToast('Screen added!'); load()
  }

  const totalSeats = screenForm.seatLayout.reduce((s, r) => s + r.count, 0)
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Theaters</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>Manage venues, screens, and seating</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', location: '', address: '', phone: '', email: '' }); setError(''); setModal('theater') }}>+ Add Theater</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
      ) : theaters.map(t => (
        <div key={t.id} className="cp-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>🏛️ {t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>📍 {t.location} · {t.address}</div>
              {t.phone && <div style={{ fontSize: 12, color: 'var(--muted)' }}>📞 {t.phone}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedTheater(t); setScreenForm({ name: '', seatLayout: [{ row: 'A', count: 10, type: 'VIP' }, { row: 'B', count: 10, type: 'VIP' }, { row: 'C', count: 12, type: 'PREMIUM' }, { row: 'D', count: 12, type: 'PREMIUM' }, { row: 'E', count: 14, type: 'REGULAR' }, { row: 'F', count: 14, type: 'REGULAR' }] }); setError(''); setModal('screen') }}>+ Add Screen</button>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {(t.screens || []).map((s: any) => (
              <div key={s.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>📽️ {s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{s._count?.seats || s.totalSeats} seats</div>
                <div style={{ fontSize: 11, color: s.active ? 'var(--green)' : 'var(--red)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>● {s.active ? 'Active' : 'Inactive'}</div>
              </div>
            ))}
            {!t.screens?.length && <div style={{ color: 'var(--muted)', fontSize: 13, padding: 8 }}>No screens yet. Add one above.</div>}
          </div>
        </div>
      ))}

      {/* Theater Modal */}
      {modal === 'theater' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Add Theater</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Theater Name', 'name', 'text'], ['City / Location', 'location', 'text'], ['Full Address', 'address', 'text'], ['Phone', 'phone', 'tel'], ['Email', 'email', 'email']].map(([lbl, key, type]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{lbl}</label>
                  <input className="cp-input" type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}/>
                </div>
              ))}
              {error && <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '8px 12px', color: 'var(--red)', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={addTheater} disabled={saving}>{saving ? <span className="spinner"/> : 'Add Theater'}</button>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Modal */}
      {modal === 'screen' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Add Screen</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>{selectedTheater?.name}</div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Screen Name</label>
              <input className="cp-input" value={screenForm.name} onChange={e => setScreenForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. IMAX Hall 1" style={{ marginBottom: 16 }}/>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Seat Layout <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>({totalSeats} total seats)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
              {screenForm.seatLayout.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 100px 32px', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center', color: 'var(--accent)' }}>Row {row.row}</span>
                  <input className="cp-input" value={row.row} onChange={e => setScreenForm(f => ({ ...f, seatLayout: f.seatLayout.map((r, j) => j === i ? { ...r, row: e.target.value.toUpperCase().slice(0, 2) } : r) }))} style={{ fontSize: 12 }} placeholder="Row label"/>
                  <input className="cp-input" type="number" min={1} max={30} value={row.count} onChange={e => setScreenForm(f => ({ ...f, seatLayout: f.seatLayout.map((r, j) => j === i ? { ...r, count: Number(e.target.value) } : r) }))} style={{ fontSize: 12 }} placeholder="Seats"/>
                  <select className="cp-input" value={row.type} onChange={e => setScreenForm(f => ({ ...f, seatLayout: f.seatLayout.map((r, j) => j === i ? { ...r, type: e.target.value } : r) }))} style={{ fontSize: 12 }}>
                    <option>VIP</option><option>PREMIUM</option><option>REGULAR</option>
                  </select>
                  <button onClick={() => setScreenForm(f => ({ ...f, seatLayout: f.seatLayout.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setScreenForm(f => ({ ...f, seatLayout: [...f.seatLayout, { row: String.fromCharCode(65 + f.seatLayout.length), count: 12, type: 'REGULAR' }] }))} style={{ marginBottom: 16 }}>+ Add Row</button>
            {error && <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '8px 12px', color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addScreen} disabled={saving}>{saving ? <span className="spinner"/> : `Add Screen (${totalSeats} seats)`}</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="animate-slideIn" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--card)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, zIndex: 200 }}>✅ {toast}</div>}
    </div>
  )
}
