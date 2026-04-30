import { z } from 'zod'

export const eventCategories = [
  'CONCERT',
  'SPORTS',
  'CONFERENCE',
  'FESTIVAL',
  'THEATER',
  'COMEDY',
] as const

export const eventTypes = [
  'SINGLE_DAY',
  'MULTI_DAY',
  'RECURRING',
] as const

export const eventStatuses = [
  'DRAFT',
  'PUBLISHED',
  'LIVE',
  'COMPLETED',
  'CANCELLED',
] as const

export const refundPolicies = [
  'FULL',
  'PARTIAL',
  'NONE',
] as const

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  category: z.enum(eventCategories),
  eventType: z.enum(eventTypes),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venueId: z.string(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  trailerUrl: z.string().url().optional().or(z.literal('')),
  capacity: z.number().int().positive(),
  refundPolicy: z.enum(refundPolicies).default('NONE'),
})

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  category: z.enum(eventCategories).optional(),
  eventType: z.enum(eventTypes).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  venueId: z.string().optional(),
  posterUrl: z.string().url().optional().or(z.literal('')).nullable(),
  bannerUrl: z.string().url().optional().or(z.literal('')).nullable(),
  trailerUrl: z.string().url().optional().or(z.literal('')).nullable(),
  capacity: z.number().int().positive().optional(),
  refundPolicy: z.enum(refundPolicies).optional(),
  status: z.enum(eventStatuses).optional(),
})

export const eventFilterSchema = z.object({
  category: z.enum(eventCategories).optional(),
  eventType: z.enum(eventTypes).optional(),
  status: z.enum(eventStatuses).optional(),
  venueId: z.string().optional(),
  startAfter: z.string().datetime().optional(),
  startBefore: z.string().datetime().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  search: z.string().optional(),
})
