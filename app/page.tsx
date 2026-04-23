'use client'
// app/page.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [location, setLocation] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedLocation = localStorage.getItem('user-location')
    if (!savedLocation) {
      setShowLocationModal(true)
    } else {
      setLocation(savedLocation)
    }

    fetch('/api/movies').then(r => r.json()).then(data => {
      setMovies(data.movies || [])
      setLoading(false)
    })
  }, [])

  function saveLocation(loc: string) {
    localStorage.setItem('user-location', loc)
    setLocation(loc)
    setShowLocationModal(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Navigation */}
      <nav style={{
        height: 72, borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', padding: '0 5%'
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--accent)', marginRight: 48 }}>
          🎬 CinePOS
        </div>
        <div style={{ display: 'flex', gap: 32, flex: 1 }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Home</Link>
          <Link href="/movies" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>Movies</Link>
          <a href="#contact" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}>Contact Us</a>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            onClick={() => setShowLocationModal(true)}
            style={{ cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)' }}
          >
            📍 {location || 'Select City'}
          </div>
          <Link href="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Login</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 5%', textAlign: 'center', background: 'linear-gradient(to bottom, var(--surface), var(--bg))' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, marginBottom: 24, letterSpacing: '-1px' }}>
          Experience Cinema Like <br/><span style={{ color: 'var(--accent)' }}>Never Before</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 600, margin: '0 auto 40px' }}>
          Book your favorite movies at the best theaters in {location || 'your city'}. Real-time seat selection and instant tickets.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button className="btn btn-primary" onClick={() => document.getElementById('movies')?.scrollIntoView({ behavior: 'smooth' })}>Book Now</button>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>View Schedule</button>
        </div>
      </section>

      {/* Movies Grid */}
      <section id="movies" style={{ padding: '60px 5%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800 }}>Now Showing</h2>
          <Link href="/movies" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>View All Movies →</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading movies...</div>
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
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '80px 5%', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Get in Touch</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Have questions about your booking? Our support team is here to help you 24/7.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📧</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Email</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>support@cinepos.com</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📞</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Phone</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14 }}>+1 (555) 123-4567</div>
                </div>
              </div>
            </div>
          </div>
          <div className="cp-card" style={{ padding: 32 }}>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input className="cp-input" placeholder="Your Name" />
              <input className="cp-input" type="email" placeholder="Email Address" />
              <textarea className="cp-input" rows={4} placeholder="Message" style={{ padding: 12 }}></textarea>
              <button type="button" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 5%', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        © 2024 CinePOS. All rights reserved.
      </footer>

      {/* Location Modal */}
      {showLocationModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div className="cp-card animate-fadeIn" style={{ maxWidth: 400, width: '100%', padding: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Welcome!</h2>
            <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 24 }}>Please select your city to see movies near you.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai'].map(city => (
                <button
                  key={city}
                  onClick={() => saveLocation(city)}
                  style={{ padding: '12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >{city}</button>
              ))}
              <div style={{ marginTop: 8 }}>
                <input
                  className="cp-input"
                  placeholder="Or enter city name..."
                  onKeyDown={e => { if (e.key === 'Enter') saveLocation(e.currentTarget.value) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
