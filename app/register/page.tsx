'use client'
// app/register/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

export default function RegisterPage() {
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR'>('CUSTOMER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const t = useI18n()
  const { language, setLanguage } = useUIStore()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    data.role = role

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Registration failed')

      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="te">తెలుగు</option>
          <option value="ta">தமிழ்</option>
        </select>
      </div>
      <div className="cp-card animate-fadeIn" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>{t('app.name')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t('auth.register')}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg)', padding: 4, borderRadius: 8 }}>
          <button
            onClick={() => setRole('CUSTOMER')}
            style={{
              flex: 1, padding: '8px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: role === 'CUSTOMER' ? 'var(--surface)' : 'transparent',
              color: role === 'CUSTOMER' ? 'var(--accent)' : 'var(--muted)',
              border: 'none', cursor: 'pointer'
            }}
          >{t('auth.customer')}</button>
          <button
            onClick={() => setRole('VENDOR')}
            style={{
              flex: 1, padding: '8px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: role === 'VENDOR' ? 'var(--surface)' : 'transparent',
              color: role === 'VENDOR' ? 'var(--accent)' : 'var(--muted)',
              border: 'none', cursor: 'pointer'
            }}
          >{t('auth.vendor')}</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{t('auth.name')}</label>
            <input name="name" className="cp-input" type="text" required placeholder="John Doe" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{t('auth.email')}</label>
            <input name="email" className="cp-input" type="email" required placeholder="john@example.com" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{t('auth.password')}</label>
            <input name="password" className="cp-input" type="password" required placeholder="••••••••" />
          </div>

          {role === 'VENDOR' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{t('theater.name')}</label>
                <input name="theaterName" className="cp-input" type="text" required placeholder="My Cinema" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{t('theater.location')}</label>
                <input name="location" className="cp-input" type="text" required placeholder="City, State" />
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--red)', fontSize: 12, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            {loading ? 'Creating Account...' : t('auth.register')}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
            {t('auth.hasAccount')} <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>{t('auth.signIn')}</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
