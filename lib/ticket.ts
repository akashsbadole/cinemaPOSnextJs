// lib/ticket.ts
// lib/ticket.ts
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { createCanvas } from "canvas";

export interface TicketData {
  bookingRef: string;
  movieTitle: string;
  showDate: string;
  showTime: string;
  screen: string;
  theater: string;
  seats: string[];
  customerName: string;
  totalAmount: number;
  format: string;
  foodItems?: Array<{ name: string; quantity: number; price: number }>;
  foodTotal?: number;
}

export async function generateTicketQR(bookingRef: string): Promise<string> {
  const data = JSON.stringify({ ref: bookingRef, ts: Date.now() });
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
    width: 200,
  });
}

export function generateBarcodeSVG(bookingRef: string): string {
  const canvas = createCanvas(1, 1);
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

export async function generateBarcodeDataURL(
  bookingRef: string,
): Promise<string> {
  return generateBarcodeSVG(bookingRef);
}

export async function generateTicketHTML(ticket: TicketData): Promise<string> {
  const qrDataUrl = await generateTicketQR(ticket.bookingRef);
  const barcodeDataUrl = generateBarcodeSVG(ticket.bookingRef);

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
.food-section { background: #f8f8f8; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .food-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; margin-bottom: 8px; }
  .food-item { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .food-subtotal { display: flex; justify-content: space-between; padding: 6px 0; border-top: 1px solid #ddd; margin-top: 6px; font-weight: 700; font-size: 13px; }
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
        ${ticket.seats.map((s) => `<span class="seat-tag">${s}</span>`).join("")}
      </div>
    </div>
    ${ticket.foodItems && ticket.foodItems.length > 0 ? `
    <div class="food-section">
      <div class="food-label">🍿 Food & Beverages</div>
      ${ticket.foodItems.map(fi => `
        <div class="food-item">
          <span>${fi.name} ×${fi.quantity}</span>
          <span>₹${(fi.price * fi.quantity).toLocaleString("en-IN")}</span>
        </div>
      `).join("")}
      <div class="food-subtotal">
        <span>Food Total</span>
        <span>₹${(ticket.foodTotal || 0).toLocaleString("en-IN")}</span>
      </div>
    </div>
    ` : ""}
    <hr class="divider">
    <div class="footer">
      <div>
        <div class="total-label">TOTAL PAID</div>
        <div class="total">₹${ticket.totalAmount.toLocaleString("en-IN")}</div>
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
</html>`;
}

export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  const qrDataUrl = await generateTicketQR(ticket.bookingRef);
  const barcodeDataUrl = generateBarcodeSVG(ticket.bookingRef);

  // Custom ticket size
  const width = 58;
  const height = 100;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [width, height] });

  // Header
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, width, 12, 'F');
  doc.setTextColor(232, 160, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CinePOS', 3, 8);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text(ticket.bookingRef, width - 3, 8, { align: 'right' });

  // Status
  doc.setTextColor(32, 200, 120);
  doc.setFontSize(8);
  doc.text('✓ CONFIRMED', 3, 18);

  // Movie
  doc.setTextColor(26, 26, 46);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.movieTitle.substring(0, 25), 3, 24);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ticket.format} • ${ticket.screen}`, 3, 28);

  // Date & Time
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(5);
  doc.text('DATE', 3, 35);
  doc.text('TIME', 30, 35);
  doc.setTextColor(26, 26, 46);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.showDate, 3, 39);
  doc.text(ticket.showTime, 30, 39);

  // Customer & Seats
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('GUEST', 3, 46);
  doc.text('SEATS', 30, 46);
  doc.setTextColor(26, 26, 46);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text((ticket.customerName || 'Guest').substring(0, 12), 3, 50);
  doc.text(ticket.seats.join(', ').substring(0, 15), 30, 50);

  // Seats box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(3, 54, width - 6, 10, 1, 1, 'F');
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(5);
  doc.text('SEATS', 5, 58);
  doc.setTextColor(26, 26, 46);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.seats.join('  '), 5, 62);

  let y = 70;
  if (ticket.foodItems && ticket.foodItems.length > 0) {
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(3, y, width - 6, 6 + ticket.foodItems.length * 4, 1, 1, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(4);
    doc.text('FOOD', 4, y + 3);
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(6);
    let fy = y + 6;
    for (const fi of ticket.foodItems) {
      doc.text(`${fi.name} x${fi.quantity}`, 4, fy);
      doc.text(`₹${fi.price * fi.quantity}`, width - 5, fy, { align: 'right' });
      fy += 4;
    }
    y += 8 + ticket.foodItems.length * 4;
  }

  // Total
  doc.setFontSize(10);
  doc.setTextColor(232, 160, 32);
  doc.text(`₹${ticket.totalAmount.toLocaleString('en-IN')}`, 3, y);
  doc.setFontSize(5);
  doc.setTextColor(150, 150, 150);
  doc.text('PAID', 3, y - 3);

  // QR Code
  doc.addImage(qrDataUrl, 'PNG', width - 18, y - 12, 14, 14);
  doc.setFontSize(4);
  doc.setTextColor(150, 150, 150);
  doc.text('SCAN', width - 11, y + 3, { align: 'center' });

  // Footer
  doc.setFontSize(4);
  doc.setTextColor(180, 180, 180);
  doc.text('Arrive 15 min before show', width / 2, height - 3, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

export function generateThermalTicket(ticket: TicketData): string {
  const width = 48;
  const center = (text: string) =>
    text.padStart((width + text.length) / 2).padEnd(width);

  let output = "";
  output += center("🎬 CinePOS") + "\n";
  output += "-".repeat(width) + "\n";
  output += center(ticket.theater) + "\n";
  output += "-".repeat(width) + "\n";
  output += center(ticket.bookingRef) + "\n";
  output += center("BOOKING CONFIRMED") + "\n";
  output += "-".repeat(width) + "\n";
  output += ticket.movieTitle + "\n";
  output += `${ticket.format} • ${ticket.screen}\n`;
  output += "-".repeat(width) + "\n";
  output += `Date    : ${ticket.showDate}\n`;
  output += `Time    : ${ticket.showTime}\n`;
  output += `Customer: ${ticket.customerName}\n`;
  output += `Screen  : ${ticket.screen}\n`;
  output += "-".repeat(width) + "\n";
  output += `SEATS: ${ticket.seats.join(", ")}\n`;
  if (ticket.foodItems && ticket.foodItems.length > 0) {
    output += "-".repeat(width) + "\n";
    output += "FOOD & BEVERAGES\n";
    for (const fi of ticket.foodItems) {
      output += `${fi.name} x${fi.quantity}  ₹${(fi.price * fi.quantity).toLocaleString("en-IN")}\n`;
    }
    output += `Food Total: ₹${(ticket.foodTotal || 0).toLocaleString("en-IN")}\n`;
  }
  output += "-".repeat(width) + "\n";
  output += center(`₹${ticket.totalAmount.toLocaleString("en-IN")}`) + "\n";
  output += center("TOTAL PAID") + "\n";
  output += "-".repeat(width) + "\n";
  output += center("SCAN AT ENTRY") + "\n";
  output += center("THANK YOU!") + "\n";
  output += "\n\n\n";

  return output;
}
