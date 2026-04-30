'use client'
// app/dashboard/notifications/page.tsx
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{ status?: string; channel?: string }>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { t } = useI18n()
  const { language, setLanguage } = useUIStore()

  useEffect(() => {
    loadNotifications()
  }, [filter, page])

  async function loadNotifications() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (filter.status) params.set('status', filter.status)
    if (filter.channel) params.set('channel', filter.channel)

    const res = await fetch(`/api/notifications?${params}`)
    const data = await res.json()
    setNotifications(data.notifications || [])
    setTotalPages(data.pagination?.pages || 1)
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    SENT: 'var(--green)',
    PENDING: 'var(--yellow)',
    FAILED: 'var(--red)',
  }

  const channelIcons: Record<string, string> = {
    sms: '📱',
    email: '📧',
    whatsapp: '💬',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Notifications Log</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>Track sent SMS and email notifications</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          value={filter.status || ''}
          onChange={e => { setFilter({ ...filter, status: e.target.value || undefined }); setPage(1) }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        >
          <option value="">All Status</option>
          <option value="SENT">Sent</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>

        <select
          value={filter.channel || ''}
          onChange={e => { setFilter({ ...filter, channel: e.target.value || undefined }); setPage(1) }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        >
          <option value="">All Channels</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
        </select>

        <button onClick={loadNotifications} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No notifications found</div>
      ) : (
        <>
          <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Channel</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Recipient</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n: any) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 18 }}>{channelIcons[n.channel] || '📤'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{n.type}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{n.recipient}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{n.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                        background: statusColors[n.status] + '20', color: statusColors[n.status],
                      }}>
                        {n.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                      {n.sentAt ? new Date(n.sentAt).toLocaleString('en-IN') : new Date(n.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: page === 1 ? 'var(--surface)' : 'var(--accent)', color: page === 1 ? 'var(--muted)' : '#000', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                ← Prev
              </button>
              <span style={{ padding: '8px 16px', color: 'var(--muted)' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: page === totalPages ? 'var(--surface)' : 'var(--accent)', color: page === totalPages ? 'var(--muted)' : '#000', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}