'use client'
// app/dashboard/settings/page.tsx
import { useState } from 'react'

export default function SettingsPage() {
  const [toast, setToast] = useState('')
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Settings</div>
        <div style={{ color: 'var(--muted)', marginTop: 2 }}>System configuration and preferences</div>
      </div>

      {[
        {
          title: '🏢 Business Information',
          fields: [
            { label: 'Business Name', placeholder: 'CinePlex Multiplex', type: 'text' },
            { label: 'GST Number', placeholder: '27AAACM1234A1ZA', type: 'text' },
            { label: 'Contact Email', placeholder: 'info@cineplex.com', type: 'email' },
            { label: 'Support Phone', placeholder: '+91 20 1234 5678', type: 'tel' },
          ]
        },
        {
          title: '🎟️ Booking Settings',
          fields: [
            { label: 'Seat Lock Duration (minutes)', placeholder: '5', type: 'number' },
            { label: 'Max Seats Per Booking', placeholder: '8', type: 'number' },
            { label: 'Booking Advance Days', placeholder: '7', type: 'number' },
            { label: 'Cancellation Window (hours)', placeholder: '1', type: 'number' },
          ]
        },
        {
          title: '📩 Notification Settings',
          fields: [
            { label: 'SMS API Key (Fast2SMS)', placeholder: 'Your API key...', type: 'password' },
            { label: 'Email (Resend API Key)', placeholder: 'Your Resend key...', type: 'password' },
            { label: 'WhatsApp Phone Number ID', placeholder: 'Meta WABA Phone ID', type: 'text' },
            { label: 'WhatsApp Access Token', placeholder: 'Meta access token...', type: 'password' },
          ]
        },
      ].map(section => (
        <div key={section.title} className="cp-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>{section.title}</div>
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {section.fields.map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{f.label}</label>
                <input className="cp-input" type={f.type} placeholder={f.placeholder}/>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => showToast('Settings saved!')}>Save Changes</button>
          </div>
        </div>
      ))}

      {/* App info */}
      <div className="cp-card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>ℹ️ Application Info</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            ['Version', 'v1.0.0'],
            ['Database', 'SQLite (Local)'],
            ['Runtime', 'Next.js 14'],
            ['Desktop', 'Tauri v1.5'],
            ['ORM', 'Prisma 5'],
            ['Auth', 'JWT / bcrypt'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="animate-slideIn" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--card)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, zIndex: 200 }}>✅ {toast}</div>}
    </div>
  )
}
