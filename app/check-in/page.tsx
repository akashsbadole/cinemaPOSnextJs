'use client'
import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function CheckInPage() {
  const [scanResult, setScanResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualTicket, setManualTicket] = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // Initialize scanner
    if (typeof window !== 'undefined') {
      scannerRef.current = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      }, false)

      scannerRef.current.render(handleScanSuccess)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Parsed QR contains JSON with ticketId or bookingRef etc
      let payload: any
      try {
        payload = JSON.parse(decodedText)
      } catch {
        // If not JSON, treat as ticketId/qrcode string
        payload = { qrCode: decodedText }
      }

      const body: any = {}
      if (payload.ticketId) body.ticketId = payload.ticketId
      if (payload.qrCode) body.qrCode = payload.qrCode

      if (!body.ticketId && !body.qrCode) {
        setError('Invalid QR code format')
        return
      }

      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.reason || data.error || 'Validation failed')
      } else {
        setScanResult(data.ticket)
        setError(null)
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleManualValidate = async () => {
    if (!manualTicket.trim()) return
    setError(null)
    setScanResult(null)
    try {
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: manualTicket }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.reason || data.error || 'Validation failed')
      } else {
        setScanResult(data.ticket)
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '40px 5%' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>Ticket Check-In</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Scanner Section */}
        <div>
          <div id="reader" style={{ borderRadius: 12, overflow: 'hidden' }}></div>
          <div style={{ marginTop: 16 }}>
            <p style={{ color: 'var(--muted)' }}>Or enter ticket number manually</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={manualTicket}
                onChange={e => setManualTicket(e.target.value)}
                placeholder="Ticket ID"
                style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
              <button
                onClick={handleManualValidate}
                style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: '#E8A020', color: '#000', fontWeight: 700, cursor: 'pointer' }}
              >
                Validate
              </button>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div>
          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {scanResult && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
              <div style={{ color: '#20C878', fontSize: 24, fontWeight: 800, marginBottom: 16 }}>✓ Ticket Valid</div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div><strong>Ticket #:</strong> {scanResult.ticketNumber}</div>
                <div><strong>Event:</strong> {scanResult.event}</div>
                <div><strong>Tier:</strong> {scanResult.tier}</div>
                <div><strong>Attendee:</strong> {scanResult.customer}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
