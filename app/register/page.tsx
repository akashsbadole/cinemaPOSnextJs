'use client'
// app/register/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR'>('CUSTOMER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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
      <div className="cp-card animate-fadeIn" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Join CinePOS</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Create your account to start booking</p>
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
          >Customer</button>
          <button
            onClick={() => setRole('VENDOR')}
            style={{
              flex: 1, padding: '8px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: role === 'VENDOR' ? 'var(--surface)' : 'transparent',
              color: role === 'VENDOR' ? 'var(--accent)' : 'var(--muted)',
              border: 'none', cursor: 'pointer'
            }}
          >Vendor</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Full Name</label>
            <input name="name" className="cp-input" type="text" required placeholder="John Doe" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Email Address</label>
            <input name="email" className="cp-input" type="email" required placeholder="john@example.com" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Password</label>
            <input name="password" className="cp-input" type="password" required placeholder="••••••••" />
          </div>

          {role === 'VENDOR' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Theater Name</label>
                <input name="theaterName" className="cp-input" type="text" required placeholder="My Cinema" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Location</label>
                <input name="location" className="cp-input" type="text" required placeholder="City, State" />
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--red)', fontSize: 12, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
