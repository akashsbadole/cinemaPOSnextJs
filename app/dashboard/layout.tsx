'use client'
// app/dashboard/layout.tsx
import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface User { id: string; name: string; email: string; role: string }
const UserContext = createContext<User | null>(null)
export const useUser = () => useContext(UserContext)

const NAV_ITEMS = [
  { section: 'Overview', items: [
    { href: '/dashboard', icon: '⬛', label: 'Dashboard' },
  ]},
  { section: 'Movies & Shows', items: [
    { href: '/dashboard/movies', icon: '🎬', label: 'Movies' },
    { href: '/dashboard/shows', icon: '🎭', label: 'Shows' },
  ]},
  { section: 'Booking', items: [
    { href: '/dashboard/pos', icon: '💳', label: 'POS Booking' },
    { href: '/dashboard/bookings', icon: '🎟️', label: 'Bookings' },
    { href: '/dashboard/coupons', icon: '🎁', label: 'Coupons' },
  ]},
  { section: 'Reports', items: [
    { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
    { href: '/dashboard/reports', icon: '📋', label: 'Reports' },
  ]},
  { section: 'Management', items: [
    { href: '/dashboard/theaters', icon: '🏛️', label: 'Theaters' },
    { href: '/dashboard/staff', icon: '👥', label: 'Staff', roles: ['SUPER_ADMIN', 'MANAGER'] },
    { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
  ]},
]

function Sidebar({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const sidebarStyle: React.CSSProperties = {
    width: 220, minWidth: 220,
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    height: '100vh',
    position: 'relative',
    zIndex: 20,
    transition: 'transform 0.25s ease',
    flexShrink: 0,
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 19, display: 'none',
        }} className="mobile-overlay" />
      )}
      <div style={{
        ...sidebarStyle,
        position: typeof window !== 'undefined' && window.innerWidth < 768 ? 'fixed' : 'relative',
        transform: typeof window !== 'undefined' && window.innerWidth < 768 && !open ? 'translateX(-100%)' : 'none',
        top: 0, left: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🎬 CinePOS
          </div>
          {user && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #f06030)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{user.role.replace('_', ' ')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '8px 8px' }}>
          {NAV_ITEMS.map(section => {
            const visibleItems = section.items.filter(item =>
              !item.roles || !user || item.roles.includes(user.role)
            )
            if (!visibleItems.length) return null
            return (
              <div key={section.section}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', padding: '10px 8px 4px' }}>
                  {section.section}
                </div>
                {visibleItems.map(item => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                        textDecoration: 'none', fontSize: 13, fontWeight: 500,
                        color: active ? 'var(--accent)' : 'var(--muted)',
                        background: active ? 'var(--accent-dim)' : 'transparent',
                        transition: 'all 0.15s',
                        position: 'relative',
                      }}
                      onMouseOver={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      {active && <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: 'var(--accent)', borderRadius: '0 2px 2px 0' }}/>}
                      <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} className="animate-pulse-slow"/>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>System Online</span>
          </div>
          <button onClick={logout} className="btn btn-ghost btn-sm btn-full" style={{ justifyContent: 'flex-start', gap: 8 }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return }
      setUser(d.user)
      setLoading(false)
    }).catch(() => router.push('/login'))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
        <div className="spinner" style={{ margin: '0 auto' }}/>
      </div>
    </div>
  )

  return (
    <UserContext.Provider value={user}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        {/* Sidebar - hidden on mobile unless open */}
        <div style={{ display: 'flex', flexShrink: 0 }} className="sidebar-container">
          <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Topbar */}
          <header style={{
            height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0,
          }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 4, display: 'flex' }}
            >☰</button>

            <div style={{ flex: 1 }}/>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'var(--accent-dim)', border: '1px solid rgba(232,160,32,0.3)',
                color: 'var(--accent)', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                padding: '3px 10px', borderRadius: 999, letterSpacing: 0.5,
              }}>
                {user?.role.replace('_', ' ')}
              </div>
              <Link href="/dashboard/pos" className="btn btn-primary btn-sm">
                + New Booking
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {children}
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-container { position: fixed; z-index: 20; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </UserContext.Provider>
  )
}
