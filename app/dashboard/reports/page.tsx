'use client'
// app/dashboard/reports/page.tsx
import { useEffect, useState } from 'react'
import { format, subDays } from 'date-fns'

export default function ReportsPage() {
  const [tab, setTab] = useState<'revenue' | 'cancellations' | 'occupancy'>('revenue')
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/reports?type=${tab}&from=${from}&to=${to}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { load() }, [tab, from, to])

  const exportCSV = () => {
    if (!data) return
    let rows: string[][] = []
    let headers: string[] = []

    if (tab === 'revenue' && data.daily) {
      headers = ['Date', 'Revenue (₹)', 'Bookings']
      rows = data.daily.map((d: any) => [d.date, d.revenue, d.count])
    } else if (tab === 'cancellations' && data.cancellations) {
      headers = ['Date', 'Booking Ref', 'Movie', 'Refund (₹)', 'Status']
      rows = data.cancellations.map((c: any) => [format(new Date(c.cancelledAt), 'dd/MM/yyyy'), c.booking?.bookingRef, c.booking?.show?.movie?.title, c.refundAmount, c.status])
    } else if (tab === 'occupancy' && data.shows) {
      headers = ['Date', 'Movie', 'Screen', 'Total', 'Booked', 'Occupancy %', 'Revenue (₹)']
      rows = data.shows.map((s: any) => [format(new Date(s.startTime), 'dd/MM/yyyy HH:mm'), s.movie, s.screen, s.total, s.booked, s.occupancyPct, s.revenue])
    }

    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cinepos-${tab}-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Reports</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>Export and analyse detailed data</div>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      {/* Tabs + Filters */}
      <div className="cp-card" style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['revenue', 'cancellations', 'occupancy'] as const).map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>From</label>
          <input type="date" className="cp-input" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 150 }}/>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>To</label>
          <input type="date" className="cp-input" value={to} onChange={e => setTo(e.target.value)} style={{ width: 150 }}/>
        </div>
      </div>

      {/* Report Table */}
      <div className="cp-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
        ) : tab === 'revenue' ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Total Revenue</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>₹{(data?.totalRevenue || 0).toLocaleString('en-IN')}</div>
              </div>
              {Object.entries(data?.byChannel || {}).map(([ch, v]: any) => (
                <div key={ch}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{ch}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700 }}>₹{v.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="cp-table">
                <thead><tr><th>Date</th><th>Revenue</th><th>Bookings</th><th>Avg per Booking</th></tr></thead>
                <tbody>
                  {(data?.daily || []).map((d: any) => (
                    <tr key={d.date}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{d.date}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>₹{d.revenue.toLocaleString('en-IN')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{d.count}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>₹{d.count > 0 ? Math.round(d.revenue / d.count).toLocaleString('en-IN') : 0}</td>
                    </tr>
                  ))}
                  {!data?.daily?.length && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No data for this period</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        ) : tab === 'cancellations' ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Total Cancellations</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--red)' }}>{data?.count || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Total Refunded</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>₹{(data?.totalRefund || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="cp-table">
                <thead><tr><th>Date</th><th>Booking</th><th>Movie</th><th>Refund</th><th>Method</th><th>Status</th></tr></thead>
                <tbody>
                  {(data?.cancellations || []).map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{format(new Date(c.cancelledAt), 'dd MMM yyyy')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>{c.booking?.bookingRef}</td>
                      <td>{c.booking?.show?.movie?.title}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{c.refundAmount}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{c.refundMethod}</td>
                      <td><span className={`badge badge-${c.status === 'APPROVED' ? 'confirmed' : 'cancelled'}`}>{c.status}</span></td>
                    </tr>
                  ))}
                  {!data?.cancellations?.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No cancellations</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cp-table">
              <thead><tr><th>Date / Time</th><th>Movie</th><th>Screen</th><th>Total</th><th>Booked</th><th>Occupancy</th><th>Revenue</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.shows || []).map((s: any) => {
                  const col = s.occupancyPct > 80 ? 'var(--green)' : s.occupancyPct > 50 ? 'var(--accent)' : 'var(--blue)'
                  return (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{format(new Date(s.startTime), 'dd/MM/yy HH:mm')}</td>
                      <td style={{ fontWeight: 500 }}>{s.movie}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{s.screen}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{s.total}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.booked}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ height: 4, width: 50, background: 'var(--subtle)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.occupancyPct}%`, background: col, borderRadius: 2 }}/>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: col }}>{s.occupancyPct}%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>₹{s.revenue.toLocaleString('en-IN')}</td>
                      <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                    </tr>
                  )
                })}
                {!data?.shows?.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No data</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
