'use client'
// app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

interface DashStats {
  todayRevenue: number; yesterdayRevenue: number; revenueGrowth: number
  todayTickets: number; yesterdayTickets: number; ticketGrowth: number
  liveShows: number; cancellations: number
  shows: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const t = useI18n()
  const { language, setLanguage } = useUIStore()

  useEffect(() => {
    Promise.all([
      fetch('/api/reports?type=dashboard').then(r => r.json()),
      fetch('/api/reports?type=revenue&from=' + new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)).then(r => r.json()),
    ]).then(([dash, rev]) => {
      setStats(dash)
      setRevenueData(rev.daily || [])
      setLoading(false)
    })

    // Auto-refresh every 60s
    const t = setInterval(() => {
      fetch('/api/reports?type=dashboard').then(r => r.json()).then(setStats)
    }, 60000)
    return () => clearInterval(t)
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }}/>
    </div>
  )

  const todayShows = stats?.shows || []

  const KPI = ({ label, value, delta, dir, icon, color }: any) => (
    <div className="cp-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: color, filter: 'blur(30px)', opacity: 0.1, transform: 'translate(20px, -20px)' }}/>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: dir === 'up' ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
        {dir === 'up' ? '↑' : '↓'} {delta}
      </div>
      <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 20, opacity: 0.4 }}>{icon}</div>
    </div>
  )

  const fmtCurrency = (v: number) => `₹${(v / 1000).toFixed(1)}K`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Dashboard</div>
          <div style={{ color: 'var(--muted)', marginTop: 4 }}>{format(new Date(), 'EEEE, dd MMMM yyyy')}</div>
        </div>
        <Link href="/dashboard/pos" className="btn btn-primary">🎟️ New Booking</Link>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <KPI label={t('dash.revenue')} value={fmtCurrency(stats?.todayRevenue || 0)}
          delta={`${stats?.revenueGrowth || 0}% ${t('common.yesterday')}`} dir={Number(stats?.revenueGrowth) >= 0 ? 'up' : 'down'}
          icon="💰" color="var(--accent)" />
        <KPI label={t('dash.tickets')} value={stats?.todayTickets || 0}
          delta={`${stats?.ticketGrowth || 0}% ${t('common.yesterday')}`} dir={Number(stats?.ticketGrowth) >= 0 ? 'up' : 'down'}
          icon="🎟️" color="var(--blue)" />
        <KPI label={t('dash.todayShows')} value={stats?.liveShows || 0} delta={t('show.live')} dir="up" icon="📽️" color="var(--green)" />
        <KPI label={t('common.cancelled')} value={stats?.cancellations || 0} delta={t('common.today')} dir="down" icon="🔁" color="var(--red)" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Revenue Chart */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>📈 {t('analytics.dailyRevenue')}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              ₹{((revenueData.reduce((s, d) => s + d.revenue, 0)) / 1000).toFixed(1)}K total
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8A020" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#E8A020" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fill: '#6B6B80', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: '#6B6B80', fontSize: 10 }} axisLine={false} tickLine={false} width={45}/>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}/>
              <Area type="monotone" dataKey="revenue" stroke="#E8A020" strokeWidth={2} fill="url(#revGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Shows Occupancy */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>🪑 Today's Show Occupancy</div>
          {todayShows.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No shows today</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todayShows.slice(0, 5).map((show: any) => {
                const pct = show.occupancyPct || 0
                const col = pct > 80 ? 'var(--green)' : pct > 50 ? 'var(--accent)' : 'var(--blue)'
                return (
                  <div key={show.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{show.movie?.title}</span>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                          {format(new Date(show.startTime), 'h:mm a')}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: col }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 2, transition: 'width 0.6s ease' }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Today's Shows Table */}
      <div className="cp-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="animate-pulse-slow" style={{ color: 'var(--red)' }}>●</span>
            Today's Shows
          </div>
          <Link href="/dashboard/shows" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="cp-table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Screen</th>
                <th>Time</th>
                <th className="hide-mobile">Format</th>
                <th>Seats</th>
                <th className="hide-mobile">Revenue</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {todayShows.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No shows scheduled today</td></tr>
              ) : todayShows.map((show: any) => (
                <tr key={show.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{show.movie?.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{show.screen?.theater?.name}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{show.screen?.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{format(new Date(show.startTime), 'h:mm a')}</td>
                  <td className="hide-mobile">
                    <span style={{ background: 'var(--subtle)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{show.movie?.format}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{show.bookedCount}/{show.totalSeats}</div>
                    <div style={{ height: 3, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden', width: 60, marginTop: 3 }}>
                      <div style={{ height: '100%', width: `${show.occupancyPct}%`, background: 'var(--accent)', borderRadius: 2 }}/>
                    </div>
                  </td>
                  <td className="hide-mobile" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                    ₹{(show.revenue || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`badge badge-${show.status.toLowerCase()}`}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}/>
                      {show.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/pos?showId=${show.id}`} className="btn btn-ghost btn-sm">Book</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
