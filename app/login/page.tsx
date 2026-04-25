'use client'
// app/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useI18n()
  const { language, setLanguage } = useUIStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@cinepos.com', password: 'admin123' },
      manager: { email: 'manager@cinepos.com', password: 'clerk123' },
      clerk: { email: 'clerk@cinepos.com', password: 'clerk123' },
    }
    setEmail(creds[role].email)
    setPassword(creds[role].password)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,160,32,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: '-5%', right: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(61,126,255,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div className="animate-fadeIn" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontSize: 48, marginBottom: 12, display: 'inline-block',
            filter: 'drop-shadow(0 0 20px rgba(232,160,32,0.3))',
          }}>🎬</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36, fontWeight: 900,
            color: 'var(--accent)',
            letterSpacing: '-1px',
}}>{t('app.name')}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            {t('app.tagline')}
          </div>
        </div>

        {/* Card */}
        <div className="cp-card" style={{ padding: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>
            {t('auth.signIn')}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                {t('auth.email')}
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="cp-input" placeholder="you@cinepos.com" required
                autoComplete="email"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                {t('auth.password')}
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="cp-input" placeholder="••••••••" required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.3)', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" /> : '→ ' + t('auth.signIn')}
            </button>
          </form>

          {/* Quick login */}
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
              Quick Login (Demo)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Admin', role: 'admin', color: 'var(--accent)' },
                { label: 'Manager', role: 'manager', color: 'var(--blue)' },
                { label: 'Clerk', role: 'clerk', color: 'var(--green)' },
              ].map(({ label, role, color }) => (
                <button key={role} type="button" onClick={() => quickLogin(role)}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '8px 4px', cursor: 'pointer',
                    color, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = color)}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 12 }}>
          v1.0.0 · CinePOS · {' '}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            style={{ background: 'transparent', color: 'var(--muted)', border: 'none', fontSize: 12, cursor: 'pointer' }}
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
            <option value="te">TE</option>
            <option value="ta">TA</option>
          </select>
</div>
      </div>
    </div>
  )
}
