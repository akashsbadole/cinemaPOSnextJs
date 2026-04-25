import { z } from 'zod'

export const createVenueSchema = z.object({
  name: z.string().min(2).max(200),
  location: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  capacity: z.number().int().positive(),
  amenities: z.array(z.string()).optional().default([]),
  accessibility: z.array(z.string()).optional().default([]),
})

export const updateVenueSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  amenities: z.array(z.string()).optional(),
  accessibility: z.array(z.string()).optional(),
})
