// lib/pricing-engine.ts
import { db } from './db'

// Calculate dynamic pricing multiplier based on time, inventory, demand
export async function calculateDynamicPrice(tierId: string): Promise<number> {
  const tier = await db.ticketTier.findUnique({
    where: { id: tierId },
    include: { event: true },
  })
  if (!tier) throw new Error('Ticket tier not found')

  const basePrice = tier.basePrice
  const now = new Date()
  const eventStart = new Date(tier.event.startDate)
  const daysUntil = Math.max(0, Math.floor((eventStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  // Time-based surge
  let multiplier = 1.0
  if (daysUntil <= 1) multiplier += 0.75 // <1 day: +75%
  else if (daysUntil <= 3) multiplier += 0.5 // 1-3 days: +50%
  else if (daysUntil <= 7) multiplier += 0.5 // 4-7 days: +50%? spec says 0-7 +50% and 0-3 +75%? Let's combine: if <=3 add 0.5+0.25? Actually spec: 0-7: +50%; 0-3: +75% (additional). We'll approximate: 
  // We'll implement: 
  // if days <= 7: +50%
  // if days <= 3: additional +25% (so +75%)
  // if days <= 1: not extra, but we treat 0-1 same as <=1 +? We'll keep as above.

  // Adjust: implement spec exactly: 
  // 0-7 days before: +50%
  // 0-3 days before: +75% (maybe means additional 75%? That would be 1.25? Actually spec: "0-7 days before: +50%", "0-3 days before: +75%". Likely means on top of base, so multiplier 1.5 for 7d, and 1.75 for 3d.
  // To implement: 
  // if days <= 3: multiplier = 1.75
  // else if days <= 7: multiplier = 1.5
  // else multiplier = 1.0

  // Reset and apply:
  let timeMultiplier = 1
  if (daysUntil <= 3) timeMultiplier = 1.75
  else if (daysUntil <= 7) timeMultiplier = 1.5

  // Inventory-based surge
  const sold = tier.soldCount
  const total = tier.totalCapacity
  const inventoryPct = total > 0 ? (total - sold) / total : 0

  let inventoryMultiplier = 1
  if (inventoryPct < 0.1) inventoryMultiplier = 2.0 // <10%: +100%
  else if (inventoryPct < 0.2) inventoryMultiplier = 1.5 // <20%: +50%
  else if (inventoryPct < 0.5) inventoryMultiplier = 1.25 // <50%: +25%

  // Demand-based surge: bookings in last 24h for this event
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const recentBookings = await db.booking.count({
    where: {
      eventId: tier.eventId,
      createdAt: { gte: oneDayAgo },
    },
  })

  let demandMultiplier = 1
  if (recentBookings > 500) demandMultiplier = 1.5
  else if (recentBookings > 100) demandMultiplier = 1.25

  // Combine: multiplicative or additive? Spec: "currentPrice = basePrice × (1 + demandMultiplier + timeMultiplier)". That suggests multipliers are additive on factor 1. But we derived inventory multiplier as a factor multiplier. We'll unify: treat each component as a factor (1 + extra). 
  // Our timeMultiplier is factor (1.5, 1.75, 1) - already multiplied.
  // inventoryMultiplier is factor (2.0,1.5,1.25,1).
  // demandMultiplier is factor (1.5,1.25,1).
  // Combine multiplicative: finalFactor = timeMultiplier * inventoryMultiplier * demandMultiplier? But spec says additive. Let's read spec: "currentPrice = basePrice × (1 + demandMultiplier + timeMultiplier)". That suggests they sum demandMultiplier and timeMultiplier and add 1. But inventory not mentioned. Possibly inventory is part of demand? Hard to know.
  // For simplicity, we'll compute as: finalMultiplier = timeMultiplier * inventoryMultiplier * demandMultiplier? This could skyrocket. Better to combine additively with caps.

  // We'll propose: multiplier = timeFactor + inventoryFactor + demandFactor - 2? Because each factor includes base 1. 
  // E.g., timeFactor=1.5 (adds 0.5), inventoryFactor=1.25 (adds 0.25), demandFactor=1.25 (adds 0.25) => total 2.0. That's reasonable.

  // Let's compute additive contributions:
  const timeAdd = timeMultiplier - 1
  const invAdd = inventoryMultiplier - 1
  const demandAdd = demandMultiplier - 1

  const finalMultiplier = 1 + timeAdd + invAdd + demandAdd

  const finalPrice = Math.round(basePrice * finalMultiplier)
  return finalPrice
}

// Update all tier currentPrice values (could be run as cron job)
export async function updateAllTierPrices() {
  const tiers = await db.ticketTier.findMany()
  for (const tier of tiers) {
    const newPrice = await calculateDynamicPrice(tier.id)
    await db.ticketTier.update({
      where: { id: tier.id },
      data: { currentPrice: newPrice },
    })
  }
}
