// lib/ticket.ts
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'

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

export function generateBarcodeSVG(bookingRef: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, bookingRef, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 14,
    margin: 0,
  })
  return canvas.toDataURL('image/png')
}

export async function generateBarcodeDataURL(bookingRef: string): Promise<string> {
  return generateBarcodeSVG(bookingRef)
}

export async function generateTicketHTML(ticket: TicketData): Promise<string> {
  const qrDataUrl = await generateTicketQR(ticket.bookingRef)
  const barcodeDataUrl = generateBarcodeSVG(ticket.bookingRef)

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
  .codes-wrap { display: flex; gap: 16px; align-items: center; justify-content: center; }
  .code-item { text-align: center; }
  .code-item img { width: 100px; height: 50px; }
  .code-label { font-size: 9px; color: #999; margin-top: 4px; }
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
      <div class="codes-wrap">
        <div class="code-item">
          <img src="${qrDataUrl}" alt="QR" />
          <div class="code-label">Scan at entry</div>
        </div>
        <div class="code-item">
          <img src="${barcodeDataUrl}" alt="Barcode" />
          <div class="code-label">Booking Ref</div>
        </div>
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

export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  const qrDataUrl = await generateTicketQR(ticket.bookingRef)
  const barcodeDataUrl = generateBarcodeSVG(ticket.bookingRef)

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  doc.setFillColor(26, 26, 46)
  doc.rect(0, 0, 210, 45, 'F')

  doc.setTextColor(232, 160, 32)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CinePOS', 15, 20)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(ticket.theater, 15, 30)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(ticket.bookingRef, 195, 20, { align: 'right' })
  doc.setTextColor(232, 160, 32)
  doc.setFontSize(9)
  doc.text('BOOKING CONFIRMED', 195, 28, { align: 'right' })

  doc.setTextColor(32, 200, 120)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('✓ CONFIRMED', 15, 55)

  doc.setTextColor(26, 26, 46)
  doc.setFontSize(18)
  doc.text(ticket.movieTitle, 15, 65)

  doc.setTextColor(100, 100, 100)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`${ticket.format} • ${ticket.screen}`, 15, 73)

  const col1X = 15
  const col2X = 110
  let y = 90

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(8)
  doc.text('DATE', col1X, y)
  doc.text('TIME', col2X, y)
  y += 6
  doc.setTextColor(26, 26, 46)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(ticket.showDate, col1X, y)
  doc.text(ticket.showTime, col2X, y)

  y += 15
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(8)
  doc.text('CUSTOMER', col1X, y)
  doc.text('SCREEN', col2X, y)
  y += 6
  doc.setTextColor(26, 26, 46)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(ticket.customerName, col1X, y)
  doc.text(ticket.screen, col2X, y)

  y += 20
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(15, y, 180, 30, 3, 3, 'F')

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(8)
  doc.text('SEAT NUMBERS', 20, y + 8)

  doc.setTextColor(26, 26, 46)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const seatsText = ticket.seats.join('  ')
  doc.text(seatsText, 20, y + 20)

  y += 45
  doc.setDrawColor(230, 230, 230)
  doc.setLineDashPattern([3, 3], 0)
  doc.line(15, y, 195, y)

  y += 15
  doc.setFontSize(20)
  doc.setTextColor(232, 160, 32)
  doc.text(`₹${ticket.totalAmount.toLocaleString('en-IN')}`, 15, y + 5)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('TOTAL PAID', 15, y)

  doc.addImage(qrDataUrl, 'PNG', 140, y - 10, 25, 25)
  doc.setFontSize(7)
  doc.text('SCAN AT ENTRY', 152.5, y + 18, { align: 'center' })

  doc.addImage(barcodeDataUrl, 'PNG', 170, y - 5, 25, 15)
  doc.setFontSize(7)
  doc.text('BOOKING REF', 182.5, y + 13, { align: 'center' })

  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text('• Arrive 15 mins before show • No outside food allowed • Ticket non-transferable', 105, 280, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

export function generateThermalTicket(ticket: TicketData): string {
  const width = 48
  const center = (text: string) => text.padStart((width + text.length) / 2).padEnd(width)
  
  let output = ''
  output += center('🎬 CinePOS') + '\n'
  output += '-'.repeat(width) + '\n'
  output += center(ticket.theater) + '\n'
  output += '-'.repeat(width) + '\n'
  output += center(ticket.bookingRef) + '\n'
  output += center('BOOKING CONFIRMED') + '\n'
  output += '-'.repeat(width) + '\n'
  output += ticket.movieTitle + '\n'
  output += `${ticket.format} • ${ticket.screen}\n`
  output += '-'.repeat(width) + '\n'
  output += `Date    : ${ticket.showDate}\n`
  output += `Time    : ${ticket.showTime}\n`
  output += `Customer: ${ticket.customerName}\n`
  output += `Screen  : ${ticket.screen}\n`
  output += '-'.repeat(width) + '\n'
  output += `SEATS: ${ticket.seats.join(', ')}\n`
  output += '-'.repeat(width) + '\n'
  output += center(`₹${ticket.totalAmount.toLocaleString('en-IN')}`) + '\n'
  output += center('TOTAL PAID') + '\n'
  output += '-'.repeat(width) + '\n'
  output += center('SCAN AT ENTRY') + '\n'
  output += center('THANK YOU!') + '\n'
  output += '\n\n\n'

  return output
}
