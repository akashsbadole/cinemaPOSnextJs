'use client'
// app/dashboard/coupons/page.tsx
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

const EMPTY = { code: '', type: 'PERCENT', value: 10, minAmount: 0, maxDiscount: '', usageLimit: '', validFrom: format(new Date(), 'yyyy-MM-dd'), validUntil: '' }

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const t = useI18n()
  const { language, setLanguage } = useUIStore()

  const load = () => { setLoading(true); fetch('/api/coupons').then(r => r.json()).then(d => { setCoupons(d.coupons || []); setLoading(false) }) }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true); setError('')
    const payload = { ...form, value: Number(form.value), minAmount: Number(form.minAmount), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined }
    const res = await fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setModal(false); showToast('Coupon created!'); load()
  }

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/coupons/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !active }) })
    showToast(active ? 'Coupon deactivated' : 'Coupon activated'); load()
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Coupons</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>Manage discount codes and promotions</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setError(''); setModal(true) }}>+ Create Coupon</button>
      </div>

      <div className="cp-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cp-table">
              <thead><tr><th>Code</th><th>Type</th><th>Value</th><th className="hide-mobile">Min Order</th><th className="hide-mobile">Usage</th><th className="hide-mobile">Valid Until</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No coupons yet</td></tr>
                ) : coupons.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '3px 10px', borderRadius: 6 }}>{c.code}</span>
                    </td>
                    <td>
                      <span style={{ background: c.type === 'PERCENT' ? 'rgba(61,126,255,0.15)' : 'rgba(32,200,120,0.15)', color: c.type === 'PERCENT' ? 'var(--blue)' : 'var(--green)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        {c.type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {c.type === 'PERCENT' ? `${c.value}%` : `₹${c.value}`}
                      {c.maxDiscount && <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>max ₹{c.maxDiscount}</span>}
                    </td>
                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>₹{c.minAmount}</td>
                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {c.usageCount}/{c.usageLimit || '∞'}
                    </td>
                    <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {c.validUntil ? format(new Date(c.validUntil), 'dd MMM yyyy') : 'No expiry'}
                    </td>
                    <td><span className={`badge ${c.active ? 'badge-confirmed' : 'badge-cancelled'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(c.id, c.active)}>
                        {c.active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Create Coupon</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Coupon Code</label>
                <input className="cp-input" value={form.code} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE50" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 1 }}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Type</label>
                  <select className="cp-input" value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}>
                    <option value="PERCENT">Percentage %</option>
                    <option value="FLAT">Flat ₹</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Value {form.type === 'PERCENT' ? '(%)' : '(₹)'}</label>
                  <input className="cp-input" type="number" value={form.value} onChange={e => setForm((f: any) => ({ ...f, value: e.target.value }))}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Min Order (₹)</label>
                  <input className="cp-input" type="number" value={form.minAmount} onChange={e => setForm((f: any) => ({ ...f, minAmount: e.target.value }))}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Max Discount (₹)</label>
                  <input className="cp-input" type="number" value={form.maxDiscount} onChange={e => setForm((f: any) => ({ ...f, maxDiscount: e.target.value }))} placeholder="Leave blank for no cap"/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Usage Limit</label>
                  <input className="cp-input" type="number" value={form.usageLimit} onChange={e => setForm((f: any) => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited"/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Valid Until</label>
                  <input className="cp-input" type="date" value={form.validUntil} onChange={e => setForm((f: any) => ({ ...f, validUntil: e.target.value }))}/>
                </div>
              </div>
              {error && <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '8px 12px', color: 'var(--red)', fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? <span className="spinner"/> : 'Create Coupon'}</button>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="animate-slideIn" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--card)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, zIndex: 200 }}>✅ {toast}</div>}
    </div>
  )
}
