import { z } from 'zod'

export const createTicketTierSchema = z.object({
  name: z.string().min(2).max(100),
  basePrice: z.number().positive(),
  totalCapacity: z.number().int().positive(),
  sectionId: z.string().optional(),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  features: z.array(z.string()).optional().default([]),
})

export const updateTicketTierSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  basePrice: z.number().positive().optional(),
  currentPrice: z.number().positive().optional(),
  totalCapacity: z.number().int().positive().optional(),
  availableCount: z.number().int().min(0).optional(),
  features: z.array(z.string()).optional(),
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),
})
