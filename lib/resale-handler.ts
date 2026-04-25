import { db } from './db'

// List a ticket for resale
export async function listTicketForResale(
  ticketId: string,
  sellerId: string,
  resalePrice: number
): Promise<{ success: boolean; listingId?: string; error?: string }> {
  // Validate ticket exists and belongs to seller
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { booking: true, event: true },
  })
  if (!ticket) return { success: false, error: 'Ticket not found' }
  if (ticket.booking?.userId !== sellerId) {
    return { success: false, error: 'You do not own this ticket' }
  }
  if (ticket.status !== 'ACTIVE') {
    return { success: false, error: 'Ticket is not active' }
  }
  // Cannot resale after event has started
  if (new Date() >= new Date(ticket.event.startDate)) {
    return { success: false, error: 'Cannot resale after event start' }
  }
  // Cannot resale within 24h of original purchase? Enforce: ticket.createdAt < now - 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  if (ticket.createdAt > twentyFourHoursAgo) {
    return { success: false, error: 'Can only resale after 24 hours from purchase' }
  }
  // Check max resales
  const resaleCount = await db.ticketResale.count({
    where: { ticketId },
  })
  if (resaleCount >= 3) {
    return { success: false, error: 'Maximum resale count reached' }
  }
  // Validate price bounds: 80-150% of originalPrice
  const originalPrice = ticket.originalPrice
  if (originalPrice <= 0) {
    return { success: false, error: 'Invalid original price' }
  }
  if (resalePrice < originalPrice * 0.8 || resalePrice > originalPrice * 1.5) {
    return { success: false, error: `Resale price must be between ₹${Math.round(originalPrice*0.8)} and ₹${Math.round(originalPrice*1.5)}` }
  }

  // Create listing
  const platformCommission = resalePrice * 0.15 // 15%
  const sellerProceeds = resalePrice - platformCommission

  const listing = await db.ticketResale.create({
    data: {
      originalBookingId: ticket.bookingId,
      sellerId,
      ticketId,
      resalePrice,
      platformCommission,
      sellerProceeds,
      status: 'LISTED',
    },
    include: { ticket: true },
  })

  return { success: true, listingId: listing.id }
}

// Purchase resale ticket
export async function purchaseResaleTicket(
  listingId: string,
  buyerId: string,
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  const listing = await db.ticketResale.findUnique({
    where: { id: listingId },
    include: { ticket: { include: { event: true, ticketTier: true } }, seller: true },
  })
  if (!listing) return { success: false, error: 'Listing not found' }
  if (listing.status !== 'LISTED') {
    return { success: false, error: 'Ticket is no longer available' }
  }


  const ticket = listing.ticket

  // Ensure ticket is still active
  if (ticket.status !== 'ACTIVE') {
    return { success: false, error: 'Ticket is not available' }
  }

  // Get buyer info
  const buyer = await db.user.findUnique({ where: { id: buyerId } })
  if (!buyer) return { success: false, error: 'Buyer not found' }

  // Transaction: transfer ticket ownership, mark listing sold
  await db.$transaction(async (tx) => {
    // Update ticket ownership
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        customerName: buyer.name,
        customerEmail: buyer.email,
        customerPhone: buyer.phone || '',
        // status remains ACTIVE
      },
    })

    // Update listing
    await tx.ticketResale.update({
      where: { id: listing.id },
      data: {
        status: 'SOLD',
        soldAt: new Date(),
        buyerId,
      },
    })

    // Increment resale count
    await tx.ticket.update({
      where: { id: ticket.id },
      data: { resaleCount: { increment: 1 } },
    })

    // Optionally create a booking record to represent the resale transaction
    // We'll create a minimal booking that references the event with channel=RESALE and store amount = resalePrice
    // But we need a bookingRef; we can generate
    const bookingRef = `RS${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(Math.random() * 9000 + 1000)}`
    await tx.booking.create({
      data: {
        bookingRef,
        userId: buyerId,
        eventId: ticket.eventId,
        showId: null,
        customerName: buyer.name,
        customerEmail: buyer.email,
        customerPhone: buyer.phone,
        status: 'CONFIRMED',
        totalAmount: listing.resalePrice,
        discountAmount: 0,
        finalAmount: listing.resalePrice,
        channel: 'RESALE',
      },
    })
  })

  // Send notifications (async)
  try {
    const { sendResaleConfirmation } = await import('@/lib/notifications')
    const eventDate = new Date(ticket.event.startDate).toLocaleString('en-IN')
    sendResaleConfirmation({
      buyerName: buyer.name,
      sellerName: listing.seller.name,
      ticketNumber: ticket.ticketNumber,
      eventTitle: ticket.event.title,
      eventDate,
      resalePrice: listing.resalePrice,
      sellerProceeds: listing.sellerProceeds,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
    }).catch(console.error)
  } catch (e) {
    console.error('Resale notification error:', e)
  }

  return { success: true }
}



// Validate Resale Price (helper)
export async function validateResalePrice(originalPrice: number, resalePrice: number): Promise<{ valid: boolean; reason?: string }> {
  if (resalePrice < originalPrice * 0.8) return { valid: false, reason: 'Price too low' }
  if (resalePrice > originalPrice * 1.5) return { valid: false, reason: 'Price too high' }
  return { valid: true }
}

// Calculate commission
export function calculateCommission(resalePrice: number, platformRate: number = 0.15) {
  const commission = resalePrice * platformRate
  const sellerProceeds = resalePrice - commission
  return { commission, sellerProceeds }
}
