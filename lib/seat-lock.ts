// lib/seat-lock.ts
import { db } from './db'

const LOCK_TTL_MINUTES = 5

export async function lockSeats(
  showId: string,
  seatIds: string[],
  sessionId: string
): Promise<{ success: boolean; conflict?: string[] }> {
  const expiresAt = new Date(Date.now() + LOCK_TTL_MINUTES * 60 * 1000)

  // Clean expired locks first
  await db.seatLock.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  // Check for existing locks by others
  const existing = await db.seatLock.findMany({
    where: {
      showId,
      seatId: { in: seatIds },
      sessionId: { not: sessionId },
      expiresAt: { gt: new Date() },
    },
  })

  if (existing.length > 0) {
    return { success: false, conflict: existing.map(l => l.seatId) }
  }

  // Check booked seats
  const booked = await db.bookingSeat.findMany({
    where: {
      seatId: { in: seatIds },
      booking: {
        showId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    },
    select: { seatId: true },
  })

  if (booked.length > 0) {
    return { success: false, conflict: booked.map(b => b.seatId) }
  }

  // Upsert locks
  for (const seatId of seatIds) {
    await db.seatLock.upsert({
      where: { showId_seatId: { showId, seatId } },
      update: { sessionId, expiresAt },
      create: { showId, seatId, sessionId, expiresAt },
    })
  }

  return { success: true }
}

export async function unlockSeats(showId: string, seatIds: string[], sessionId: string) {
  await db.seatLock.deleteMany({
    where: { showId, seatId: { in: seatIds }, sessionId },
  })
}

export async function getShowSeatStatus(showId: string) {
  // Clean expired
  await db.seatLock.deleteMany({ where: { expiresAt: { lt: new Date() } } })

  const [bookedSeats, lockedSeats] = await Promise.all([
    db.bookingSeat.findMany({
      where: { booking: { showId, status: { in: ['CONFIRMED', 'PENDING'] } } },
      select: { seatId: true },
    }),
    db.seatLock.findMany({
      where: { showId, expiresAt: { gt: new Date() } },
      select: { seatId: true, sessionId: true, expiresAt: true },
    }),
  ])

  return {
    booked: new Set(bookedSeats.map(b => b.seatId)),
    locked: new Map(lockedSeats.map(l => [l.seatId, { sessionId: l.sessionId, expiresAt: l.expiresAt }])),
  }
}

export async function generateBookingRef(): Promise<string> {
  const prefix = 'BK'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `${prefix}${date}${random}`
}
