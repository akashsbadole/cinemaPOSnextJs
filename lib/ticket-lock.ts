import { db } from '@/lib/db'

const LOCK_TTL_MINUTES = 5

// Lock tickets for a given tier and quantity
export async function lockTickets(
  eventId: string,
  ticketTierId: string,
  quantity: number,
  sessionId: string
): Promise<{ success: boolean; conflict?: number }> {
  const expiresAt = new Date(Date.now() + LOCK_TTL_MINUTES * 60 * 1000)

  // Clean expired locks
  await db.ticketLock.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  // Check for existing locks by other sessions
  const existing = await db.ticketLock.findFirst({
    where: {
      eventId,
      ticketTierId,
      sessionId: { not: sessionId },
      expiresAt: { gt: new Date() },
    },
  })

  if (existing) {
    return { success: false, conflict: existing.quantity }
  }

  // Check if enough available capacity
  const tier = await db.ticketTier.findUnique({
    where: { id: ticketTierId },
  })
  if (!tier) {
    return { success: false, conflict: 0 } // tier not found
  }

  const soldCount = tier.soldCount
  const lockedCount = await getLockedCount(ticketTierId)
  const available = tier.totalCapacity - soldCount - lockedCount

  if (quantity > available) {
    return { success: false, conflict: available }
  }

  // Upsert lock (create or update)
  await db.ticketLock.upsert({
    where: {
      eventId_ticketTierId_sessionId: {
        eventId,
        ticketTierId,
        sessionId,
      },
    },
    update: { quantity, expiresAt },
    create: {
      eventId,
      ticketTierId,
      quantity,
      sessionId,
      expiresAt,
    },
  })

  return { success: true }
}

// Unlock tickets (release lock)
export async function unlockTickets(
  eventId: string,
  ticketTierId: string,
  quantity: number,
  sessionId: string
): Promise<void> {
  await db.ticketLock.deleteMany({
    where: {
      eventId,
      ticketTierId,
      sessionId,
    },
  })
}

// Get locked count for a tier (excluding expired)
async function getLockedCount(ticketTierId: string): Promise<number> {
  const locks = await db.ticketLock.findMany({
    where: {
      ticketTierId,
      expiresAt: { gt: new Date() },
    },
    select: { quantity: true },
  })
  return locks.reduce((sum, lock) => sum + lock.quantity, 0)
}

// Get real-time availability for all tiers of an event
export async function getTicketAvailability(eventId: string): Promise<{
  tiers: Array<{
    tierId: string
    tierName: string
    totalCapacity: number
    soldCount: number
    lockedCount: number
    availableCount: number
    currentPrice: number
  }>
}> {
  await db.ticketLock.deleteMany({ where: { expiresAt: { lt: new Date() } } })

  const tiers = await db.ticketTier.findMany({
    where: { eventId },
    include: {
      _count: { select: { tickets: true } },
      ticketLocks: { where: { expiresAt: { gt: new Date() } } },
    },
  })

  const result = tiers.map(t => {
    const locked = t.ticketLocks.reduce((s, l) => s + l.quantity, 0)
    const sold = t._count.tickets
    const available = Math.max(0, t.totalCapacity - sold - locked)
    return {
      tierId: t.id,
      tierName: t.name,
      totalCapacity: t.totalCapacity,
      soldCount: sold,
      lockedCount: locked,
      availableCount: available,
      currentPrice: t.currentPrice,
    }
  })

  return { tiers: result }
}
