// lib/ticket.ts
import QRCode from 'qrcode'

export interface TicketData {
  bookingRef: string
  movieTitle: string
  showDate: string
  showTime: string
  screen: string
  theater: string
  seats: string[]
  customerName: string
  totalAmount: number
  format: string
}

export async function generateTicketQR(bookingRef: string): Promise<string> {
  const data = JSON.stringify({ ref: bookingRef, ts: Date.now() })
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
    width: 200,
  })
}

export async function generateTicketHTML(ticket: TicketData): Promise<string> {
  const qrDataUrl = await generateTicketQR(ticket.bookingRef)

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
  .ticket {
    width: 600px; margin: 0 auto;
    background: white; border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    overflow: hidden;
  }
  .ticket-header {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: white; padding: 24px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .brand { font-size: 24px; font-weight: 900; color: #E8A020; }
  .booking-ref { font-family: monospace; font-size: 14px; color: #aaa; }
  .ticket-body { padding: 24px; }
  .movie-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .movie-meta { color: #666; font-size: 13px; margin-bottom: 20px; }
  .info-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 16px; margin-bottom: 20px;
  }
  .info-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; }
  .info-item p { font-size: 15px; font-weight: 600; color: #1a1a2e; margin-top: 2px; }
  .seats-section { background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .seats-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; margin-bottom: 8px; }
  .seats { display: flex; gap: 8px; flex-wrap: wrap; }
  .seat-tag { background: #E8A020; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 13px; }
  .divider { border: none; border-top: 2px dashed #eee; margin: 20px 0; }
  .footer { display: flex; justify-content: space-between; align-items: center; }
  .total { font-size: 24px; font-weight: 900; color: #E8A020; }
  .total-label { font-size: 11px; color: #999; }
  .qr-wrap { text-align: center; }
  .qr-wrap img { width: 100px; height: 100px; }
  .qr-label { font-size: 9px; color: #999; margin-top: 4px; }
  .terms { font-size: 10px; color: #bbb; margin-top: 16px; text-align: center; }
  .status-badge { 
    display: inline-block; background: #20C878; color: white; 
    padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
    margin-bottom: 8px;
  }
</style>
</head>
<body>
<div class="ticket">
  <div class="ticket-header">
    <div>
      <div class="brand">🎬 CinePOS</div>
      <div class="booking-ref">${ticket.theater}</div>
    </div>
    <div style="text-align:right">
      <div class="booking-ref">${ticket.bookingRef}</div>
      <div style="color:#E8A020;font-size:11px;margin-top:4px">BOOKING CONFIRMED</div>
    </div>
  </div>
  <div class="ticket-body">
    <div class="status-badge">✓ CONFIRMED</div>
    <div class="movie-title">${ticket.movieTitle}</div>
    <div class="movie-meta">${ticket.format} · ${ticket.screen}</div>
    <div class="info-grid">
      <div class="info-item">
        <label>Date</label>
        <p>${ticket.showDate}</p>
      </div>
      <div class="info-item">
        <label>Time</label>
        <p>${ticket.showTime}</p>
      </div>
      <div class="info-item">
        <label>Customer</label>
        <p>${ticket.customerName}</p>
      </div>
      <div class="info-item">
        <label>Screen</label>
        <p>${ticket.screen}</p>
      </div>
    </div>
    <div class="seats-section">
      <div class="seats-label">Seat Numbers</div>
      <div class="seats">
        ${ticket.seats.map(s => `<span class="seat-tag">${s}</span>`).join('')}
      </div>
    </div>
    <hr class="divider">
    <div class="footer">
      <div>
        <div class="total-label">TOTAL PAID</div>
        <div class="total">₹${ticket.totalAmount.toLocaleString('en-IN')}</div>
      </div>
      <div class="qr-wrap">
        <img src="${qrDataUrl}" alt="QR Code" />
        <div class="qr-label">Scan at entry</div>
      </div>
    </div>
    <div class="terms">
      • Report 15 mins before show • No outside food allowed • Ticket non-transferable
    </div>
  </div>
</div>
</body>
</html>`
}
