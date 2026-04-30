'use client'
// app/dashboard/scan/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/lib/store'

export default function ScanTicketPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'manual' | 'camera'>('manual')
  const [bookingRef, setBookingRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const { t } = useI18n()
  const { language, setLanguage } = useUIStore()
  const scannerDivRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (mode === 'camera' && !cameraActive) {
      startCamera()
    } else if (mode === 'manual' && cameraActive) {
      stopCamera()
    }
  }, [mode])

  async function startCamera() {
    if (!scannerDivRef.current) return
    try {
      const scanner = new Html5Qrcode('scanner-region')
      scannerRef.current = scanner
      
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          try {
            const data = JSON.parse(decodedText)
            if (data.ref) {
              await scanner.stop()
              setCameraActive(false)
              verifyTicket(data.ref)
            }
          } catch {
            await scanner.stop()
            setCameraActive(false)
            verifyTicket(decodedText)
          }
        },
        () => {}
      )
      setCameraActive(true)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Camera not available. Use manual entry.')
      setMode('manual')
    }
  }

  async function stopCamera() {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
      setCameraActive(false)
    }
  }

  async function verifyTicket(ref?: string) {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/ticket/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: ref || bookingRef }),
      })
      const data = await res.json()
      if (data.valid) {
        setResult(data.ticket)
      } else {
        setError(data.error || 'Invalid ticket')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setError('')
    setBookingRef('')
    if (mode === 'camera') startCamera()
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Scan Ticket</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>Verify ticket authenticity at entry point</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => { stopCamera(); setMode('manual') }}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)',
            background: mode === 'manual' ? 'var(--accent)' : 'transparent',
            color: mode === 'manual' ? '#000' : 'var(--muted)', fontWeight: 600, cursor: 'pointer',
          }}>
          📝 Manual Entry
        </button>
        <button onClick={() => setMode('camera')}
          style={{
            flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)',
            background: mode === 'camera' ? 'var(--accent)' : 'transparent',
            color: mode === 'camera' ? '#000' : 'var(--muted)', fontWeight: 600, cursor: 'pointer',
          }}>
          📷 Scan QR
        </button>
      </div>

      {!result && !error && (
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, border: '1px solid var(--border)' }}>
          {mode === 'manual' ? (
            <>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Booking Reference</label>
              <input
                value={bookingRef}
                onChange={e => setBookingRef(e.target.value.toUpperCase())}
                placeholder="Enter booking reference (e.g., BK123456)"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 16, fontFamily: 'var(--font-mono)',
                  marginBottom: 16,
                }}
                onKeyDown={e => e.key === 'Enter' && verifyTicket()}
              />
              <button onClick={() => verifyTicket()} disabled={!bookingRef || loading}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                  background: bookingRef && !loading ? 'var(--accent)' : 'var(--border)',
                  color: bookingRef && !loading ? '#000' : 'var(--muted)', fontWeight: 700, cursor: bookingRef && !loading ? 'pointer' : 'not-allowed',
                }}>
                {loading ? 'Verifying...' : 'Verify Ticket'}
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div id="scanner-region" ref={scannerDivRef} style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }} />
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Point camera at QR code</p>
              <button onClick={stopCamera} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>
                Stop Camera
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#2a1515', border: '1px solid #ef4444', borderRadius: 12, padding: 20,
          textAlign: 'center', marginBottom: 16 
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
          <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: 16 }}>Invalid Ticket</div>
          <div style={{ color: '#fca5a5', marginTop: 4 }}>{error}</div>
          <button onClick={reset} style={{
            marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>
            Try Again
          </button>
        </div>
      )}

      {result && (
        <div style={{ 
          background: '#122a1a', border: '1px solid #20C878', borderRadius: 12, padding: 20,
          textAlign: 'center', marginBottom: 16 
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ color: '#6ee7b7', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Valid Ticket</div>
          
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 16, textAlign: 'left',
            marginBottom: 16 
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 4 }}>{result.movieTitle}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>{result.format} · {result.screen}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Date & Time</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{result.showDate} {result.showTime}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Customer</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{result.customerName}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Seats</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{result.seats.join(', ')}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Amount</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>₹{result.totalAmount}</div>
              </div>
            </div>
          </div>
          
          <button onClick={reset} style={{
            width: '100%', padding: '12px', borderRadius: 8, border: 'none',
            background: '#20C878', color: '#000', fontWeight: 700, cursor: 'pointer',
          }}>
            Scan Next
          </button>
        </div>
      )}
    </div>
  )
}