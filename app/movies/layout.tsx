// app/movies/layout.tsx
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const { language, setLanguage } = useUIStore()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header
        style={{
          height: 64,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 5%',
          justifyContent: 'space-between',
          background: 'var(--surface)',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 900,
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
        >
          🎬 {t('app.name')}
        </Link>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/movies" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
            {t('nav.movies')}
          </Link>
          <Link href="/dashboard" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
            {t('nav.dashboard')}
          </Link>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            style={{
              background: 'var(--card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
            <option value="te">TE</option>
            <option value="ta">TA</option>
          </select>
        </nav>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '40px 5%',
          background: 'var(--surface)',
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 20 }}>
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: 8 }}>Contact Us</h4>
            <p>Email: info@cinepos.com</p>
            <p>Phone: +91 99999 99999</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: 8 }}>Follow Us</h4>
            <p>Social Media Links</p>
          </div>
        </div>
        <p>&copy; 2026 CinePOS. All rights reserved.</p>
      </footer>
    </div>
  )
}