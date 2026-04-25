'use client'
// app/movies/[id]/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

export default function MovieDetailsPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState<any>(null)
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const t = useI18n()
  const { language, setLanguage } = useUIStore()

  useEffect(() => {
    Promise.all([
      fetch(`/api/movies/${id}`).then(r => r.json()),
      fetch(`/api/shows?movieId=${id}`).then(r => r.json())
    ]).then(([movieData, showsData]) => {
      setMovie(movieData)
      setShows(showsData)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>{t('common.loading')}</div>
  if (!movie) return <div style={{ padding: 50, textAlign: 'center' }}>{t('common.error')}</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ height: 64, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 5%', justifyContent: 'space-between' }}>
        <Link href="/movies" style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--accent)', textDecoration: 'none' }}>← Back</Link>
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
      </nav>
      <div style={{ height: 400, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `url(${movie.posterUrl}) center/cover no-repeat`, filter: 'blur(40px) brightness(0.3)', transform: 'scale(1.1)' }} />
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', padding: '0 5% 40px', gap: 40 }}>
          <div style={{ width: 200, aspectRatio: '2/3', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', background: 'var(--surface)', flexShrink: 0 }}>
             <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ paddingBottom: 10 }}>
            <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 12 }}>{movie.title}</h1>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <span style={{ background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{movie.rating}</span>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>{movie.duration} min • {movie.format} • {movie.language}</span>
            </div>
            <p style={{ maxWidth: 700, color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.6 }}>{movie.description}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '60px 5%', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 60 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>{t('booking.selectShow')}</h2>

          {shows.length === 0 ? (
            <div style={{ padding: 40, background: 'var(--surface)', borderRadius: 12, textAlign: 'center', color: 'var(--muted)' }}>
              {t('common.noData')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* Group by theater/screen in real app, here simple list */}
              {shows.map((show: any) => (
                <div key={show.id} className="cp-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{show.screen.theater.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{show.screen.name} • {new Date(show.startTime).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => router.push(`/booking/${show.id}`)}
                    >
                      {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="cp-card" style={{ padding: 24, position: 'sticky', top: 100 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Movie Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Genre</div>
                <div style={{ fontSize: 14 }}>{movie.genre}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Release Date</div>
                <div style={{ fontSize: 14 }}>{new Date(movie.releaseDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
