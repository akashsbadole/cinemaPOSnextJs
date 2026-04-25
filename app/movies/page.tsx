'use client'
// app/movies/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

export default function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const t = useI18n()
  const { language, setLanguage } = useUIStore()

  useEffect(() => {
    fetch('/api/movies').then(r => r.json()).then(data => {
      setMovies(data.movies || [])
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Simple Nav */}
      <div style={{ height: 64, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 5%', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--accent)', textDecoration: 'none' }}>🎬 {t('app.name')}</Link>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
        >
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="te">TE</option>
          <option value="ta">TA</option>
        </select>
      </div>

      <div style={{ padding: '40px 5%' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 40 }}>{t('nav.movies')}</h1>

        {loading ? (
          <div>{t('common.loading')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 32 }}>
            {movies.map((movie: any) => (
              <div key={movie.id} className="cp-card" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => router.push(`/movies/${movie.id}`)}>
                <div style={{ aspectRatio: '2/3', borderRadius: 12, overflow: 'hidden', background: 'var(--surface)', marginBottom: 16, border: '1px solid var(--border)' }}>
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎬</div>
                  )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{movie.title}</h3>
                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                  <span>{movie.format}</span> • <span>{movie.language}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
