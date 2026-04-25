'use client'
// app/dashboard/staff/page.tsx
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

const ROLE_COLORS: Record<string, string> = { SUPER_ADMIN: 'var(--accent)', THEATER_OWNER: 'var(--purple)', MANAGER: 'var(--blue)', CLERK: 'var(--green)' }
const EMPTY = { name: '', email: '', password: '', role: 'CLERK', phone: '' }

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const t = useI18n()
  const { language, setLanguage } = useUIStore()

  const load = () => { setLoading(true); fetch('/api/staff').then(r => r.json()).then(d => { setStaff(d.staff || []); setLoading(false) }) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setError(''); setModal('add') }
  const openEdit = (m: any) => { setForm({ ...m, password: '' }); setError(''); setModal('edit') }

  const save = async () => {
    setSaving(true); setError('')
    const method = modal === 'edit' ? 'PUT' : 'POST'
    const url = modal === 'edit' ? `/api/staff/${form.id}` : '/api/staff'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Failed'); return }
    setModal(null); showToast(modal === 'add' ? 'Staff added' : 'Staff updated'); load()
  }

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this staff member?')) return
    await fetch(`/api/staff/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false }) })
    showToast('Staff deactivated'); load()
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Staff & Roles</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>Manage team members and permissions</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Staff</button>
      </div>

      {/* Role guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {[
          { role: 'SUPER_ADMIN', desc: 'Full access to everything', icon: '👑' },
          { role: 'THEATER_OWNER', desc: 'Manage own theater', icon: '🏛️' },
          { role: 'MANAGER', desc: 'Reports + Shows', icon: '📊' },
          { role: 'CLERK', desc: 'POS booking only', icon: '💳' },
        ].map(r => (
          <div key={r.role} className="cp-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: ROLE_COLORS[r.role] }}>{r.role.replace('_', ' ')}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="cp-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cp-table">
              <thead><tr><th>Name</th><th>Email</th><th className="hide-mobile">Phone</th><th>Role</th><th>Status</th><th className="hide-mobile">Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ROLE_COLORS[s.role]}30`, border: `1px solid ${ROLE_COLORS[s.role]}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: ROLE_COLORS[s.role], flexShrink: 0 }}>
                          {s.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{s.email}</td>
                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{s.phone || '—'}</td>
                    <td>
                      <span style={{ background: `${ROLE_COLORS[s.role]}20`, color: ROLE_COLORS[s.role], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {s.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td><span className={`badge ${s.active ? 'badge-confirmed' : 'badge-cancelled'}`}>{s.active ? 'Active' : 'Inactive'}</span></td>
                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{format(new Date(s.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        {s.active && <button className="btn btn-danger btn-sm" onClick={() => deactivate(s.id)}>×</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{modal === 'add' ? 'Add Staff Member' : 'Edit Staff'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Name', 'name', 'text', 'Full name'], ['Email', 'email', 'email', 'email@example.com'], ['Phone', 'phone', 'tel', '+91 XXXXX XXXXX'], ['Password', 'password', 'password', modal === 'edit' ? 'Leave blank to keep' : 'Min 6 chars']].map(([lbl, key, type, ph]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{lbl}</label>
                    <input className="cp-input" type={type} value={form[key] || ''} onChange={e => setForm((f: any) => ({ ...f, [key]: e.target.value }))} placeholder={ph} disabled={key === 'email' && modal === 'edit'}/>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Role</label>
                <select className="cp-input" value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}>
                  {['CLERK', 'MANAGER', 'THEATER_OWNER', 'SUPER_ADMIN'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              {error && <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '8px 12px', color: 'var(--red)', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? <span className="spinner"/> : modal === 'add' ? 'Add Staff' : 'Save'}</button>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="animate-slideIn" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--card)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, zIndex: 200 }}>✅ {toast}</div>}
    </div>
  )
}
