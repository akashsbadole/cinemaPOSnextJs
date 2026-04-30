'use client'
// app/dashboard/analytics/page.tsx
import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { format, subDays } from 'date-fns'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

const COLORS_ARR = ['#E8A020', '#3D7EFF', '#20C878', '#9B59F5', '#E84040']

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<any>(null)
  const [occupancy, setOccupancy] = useState<any>(null)
  const [movieStats, setMovieStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7')
  const { t } = useI18n()
  const { language, setLanguage } = useUIStore()

  const fromDate = format(subDays(new Date(), parseInt(dateRange)), 'yyyy-MM-dd')
  const toDate = format(new Date(), 'yyyy-MM-dd')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch(`/api/reports?type=revenue&from=${fromDate}&to=${toDate}`).then(r => r.json()),
      fetch(`/api/reports?type=occupancy&from=${fromDate}&to=${toDate}`).then(r => r.json()),
      fetch(`/api/reports?type=movies&from=${fromDate}&to=${toDate}`).then(r => r.json()),
    ]).then(([rev, occ, mov]) => {
      setRevenue(rev)
      setOccupancy(occ)
      setMovieStats(mov)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [dateRange])

  const channelData = revenue?.byChannel ? Object.entries(revenue.byChannel).map(([name, value]) => ({ name, value })) : []
  const totalRevenue = revenue?.totalRevenue || 0
  const avgOcc = occupancy?.avgOccupancy || 0

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }}/>
    </div>
  )

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Analytics</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>Performance insights & trends</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['7', '7D'], ['14', '14D'], ['30', '30D'], ['90', '3M']].map(([v, l]) => (
            <button key={v} className={`btn btn-sm ${dateRange === v ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDateRange(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, icon: '💰', color: 'var(--accent)' },
          { label: 'Total Bookings', value: revenue?.daily?.reduce((s: number, d: any) => s + d.count, 0) || 0, icon: '🎟️', color: 'var(--blue)' },
          { label: 'Avg Occupancy', value: `${avgOcc}%`, icon: '🪑', color: 'var(--green)' },
          { label: 'Top Movie Revenue', value: movieStats?.movies?.[0] ? `₹${(movieStats.movies[0].revenue / 1000).toFixed(1)}K` : '—', icon: '🏆', color: 'var(--purple)' },
        ].map(k => (
          <div key={k.label} className="cp-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, borderRadius: '50%', background: k.color, filter: 'blur(25px)', opacity: 0.12, transform: 'translate(15px, -15px)' }}/>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{k.value}</div>
            <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 20, opacity: 0.35 }}>{k.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Revenue chart */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>📈 Daily Revenue</div>
          {revenue?.daily?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenue.daily} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8A020" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#E8A020" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fill: '#6B6B80', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#6B6B80', fontSize: 10 }} axisLine={false} tickLine={false} width={45}/>
                <Tooltip contentStyle={{ background: '#16161F', border: '1px solid #1E1E2E', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}/>
                <Area type="monotone" dataKey="revenue" stroke="#E8A020" strokeWidth={2} fill="url(#revGrad2)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 13 }}>No data for this period</div>}
        </div>

        {/* Bookings per day */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>🎟️ Daily Bookings</div>
          {revenue?.daily?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenue.daily} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fill: '#6B6B80', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#6B6B80', fontSize: 10 }} axisLine={false} tickLine={false} width={30}/>
                <Tooltip contentStyle={{ background: '#16161F', border: '1px solid #1E1E2E', borderRadius: 8, fontSize: 12 }}/>
                <Bar dataKey="count" fill="#3D7EFF" radius={[4, 4, 0, 0]} name="Bookings"/>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 13 }}>No data</div>}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Booking channels pie */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>📡 Revenue by Channel</div>
          {channelData.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2}>
                    {channelData.map((_: any, i: number) => <Cell key={i} fill={COLORS_ARR[i % COLORS_ARR.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#16161F', border: '1px solid #1E1E2E', borderRadius: 8, fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {channelData.map((d: any, i: number) => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS_ARR[i % COLORS_ARR.length], flexShrink: 0 }}/>
                      {d.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>₹{(d.value / 1000).toFixed(1)}K</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>No data</div>}
        </div>

        {/* Top movies */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>🏆 Top Movies by Revenue</div>
          {movieStats?.movies?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {movieStats.movies.slice(0, 5).map((m: any, i: number) => {
                const maxRev = movieStats.movies[0].revenue
                const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0
                return (
                  <div key={m.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--muted)', width: 20 }}>{i + 1}</span>
                        <span style={{ fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>₹{(m.revenue / 1000).toFixed(1)}K</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: COLORS_ARR[i % COLORS_ARR.length], borderRadius: 2, transition: 'width 0.6s ease' }}/>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{m.tickets} tickets · {m.bookings} bookings</div>
                  </div>
                )
              })}
            </div>
          ) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>No data</div>}
        </div>

        {/* Occupancy table */}
        <div className="cp-card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>🪑 Show Occupancy ({avgOcc}% avg)</div>
          {occupancy?.shows?.length ? (
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {occupancy.shows.slice(0, 10).map((s: any) => {
                const col = s.occupancyPct > 80 ? 'var(--green)' : s.occupancyPct > 50 ? 'var(--accent)' : 'var(--blue)'
                return (
                  <div key={s.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 500, maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.movie}</span>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 10 }}>{format(new Date(s.startTime), 'dd/MM h:mm a')}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: col }}>{s.occupancyPct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 3, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.occupancyPct}%`, background: col, borderRadius: 2 }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>No data</div>}
        </div>
      </div>
    </div>
  )
}
