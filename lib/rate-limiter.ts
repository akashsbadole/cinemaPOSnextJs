// lib/rate-limiter.ts
type RateLimitStore = Map<string, number[]>

const store: RateLimitStore = new Map()
const CLEUP_INTERVAL_MS = 60 * 1000 // clean every minute

// Clean old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of store) {
    const valid = timestamps.filter(t => now - t < 60 * 1000)
    if (valid.length === 0) {
      store.delete(key)
    } else {
      store.set(key, valid)
    }
  }
}, CLEUP_INTERVAL_MS)

/**
 * Check if a request from given identifier should be rate limited.
 * @param identifier Unique key (e.g., userId or IP)
 * @param maxRequests Max requests allowed per window
 * @param windowMs Time window in milliseconds
 * @returns true if rate limited (too many requests), false otherwise
 */
export function isRateLimited(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  let timestamps = store.get(identifier)
  if (!timestamps) {
    timestamps = []
  }

  // Remove timestamps older than window
  const valid = timestamps.filter(t => now - t < windowMs)
  if (valid.length >= maxRequests) {
    return true
  }

  // Add current timestamp
  valid.push(now)
  store.set(identifier, valid)
  return false
}
