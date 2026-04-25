'use client'
// app/dashboard/settings/page.tsx
import { useState, useEffect } from 'react'
import { useUIStore } from '@/lib/store'
import { useI18n } from '@/lib/i18n'

export default function SettingsPage() {
  const [toast, setToast] = useState('')
  const { theme, toggleTheme, language, setLanguage } = useUIStore()
  const t = useI18n()
  const [settings, setSettings] = useState<any>({
    RAZORPAY_ENABLED: 'false',
    RAZORPAY_KEY_ID: '',
    RAZORPAY_KEY_SECRET: '',
    SMS_ENABLED: 'true',
    EMAIL_ENABLED: 'true',
    WHATSAPP_ENABLED: 'false',
    AUTO_SEND_REMINDER: 'true',
    REMINDER_HOURS_BEFORE: '2',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: any) => {
        setSettings((prev: any) => ({ ...prev, ...data }))
        setLoading(false)
      })
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSave() {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) showToast('Settings saved!')
      else throw new Error('Failed to save')
    } catch (err) {
      showToast('Error saving settings')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>{t('settings.profile')}</div>
        <div style={{ color: 'var(--muted)', marginTop: 2 }}>System configuration and preferences</div>
      </div>

      <div className="cp-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>🎨 {t('settings.theme')} & {t('settings.language')}</div>
        <div style={{ padding: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={toggleTheme}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}
            >
              {theme === 'dark' ? '🌙 ' + t('settings.dark') : '☀️ ' + t('settings.light')}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="cp-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>💳 Payment Settings (Razorpay)</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="razorpay-enabled"
              checked={settings.RAZORPAY_ENABLED === 'true'}
              onChange={e => setSettings({ ...settings, RAZORPAY_ENABLED: String(e.target.checked) })}
            />
            <label htmlFor="razorpay-enabled" style={{ fontSize: 13, fontWeight: 500 }}>Enable Razorpay Online Booking</label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Razorpay Key ID</label>
              <input
                className="cp-input"
                type="text"
                placeholder="rzp_test_..."
                value={settings.RAZORPAY_KEY_ID}
                onChange={e => setSettings({ ...settings, RAZORPAY_KEY_ID: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Razorpay Key Secret</label>
              <input
                className="cp-input"
                type="password"
                placeholder="••••••••••••"
                value={settings.RAZORPAY_KEY_SECRET}
                onChange={e => setSettings({ ...settings, RAZORPAY_KEY_SECRET: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Changes</button>
        </div>
      </div>

      <div className="cp-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>📱 Notification Settings</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="sms-enabled"
              checked={settings.SMS_ENABLED === 'true'}
              onChange={e => setSettings({ ...settings, SMS_ENABLED: String(e.target.checked) })}
            />
            <label htmlFor="sms-enabled" style={{ fontSize: 13, fontWeight: 500 }}>Enable SMS Notifications</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="email-enabled"
              checked={settings.EMAIL_ENABLED === 'true'}
              onChange={e => setSettings({ ...settings, EMAIL_ENABLED: String(e.target.checked) })}
            />
            <label htmlFor="email-enabled" style={{ fontSize: 13, fontWeight: 500 }}>Enable Email Notifications</label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              id="whatsapp-enabled"
              checked={settings.WHATSAPP_ENABLED === 'true'}
              onChange={e => setSettings({ ...settings, WHATSAPP_ENABLED: String(e.target.checked) })}
            />
            <label htmlFor="whatsapp-enabled" style={{ fontSize: 13, fontWeight: 500 }}>Enable WhatsApp Notifications</label>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <input
                type="checkbox"
                id="auto-reminder"
                checked={settings.AUTO_SEND_REMINDER === 'true'}
                onChange={e => setSettings({ ...settings, AUTO_SEND_REMINDER: String(e.target.checked) })}
              />
              <label htmlFor="auto-reminder" style={{ fontSize: 13, fontWeight: 500 }}>Auto-send show reminders</label>
            </div>
            {settings.AUTO_SEND_REMINDER === 'true' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 13 }}>Hours before show:</label>
                <input
                  className="cp-input"
                  type="number"
                  style={{ width: 80 }}
                  value={settings.REMINDER_HOURS_BEFORE}
                  onChange={e => setSettings({ ...settings, REMINDER_HOURS_BEFORE: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Changes</button>
        </div>
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

      {toast && <div className="animate-slideIn" style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--card)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, zIndex: 200 }}>✅ {toast}</div>}
    </div>
  )
}
