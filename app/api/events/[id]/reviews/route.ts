import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

// GET /api/events/[id]/reviews - Get reviews for event
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const reviews = await db.review.findMany({
    where: { eventId: id },
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ reviews })
}

// POST /api/events/[id]/reviews - Submit review
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const data = reviewSchema.parse(body)

  // Ensure user has attended the event (has a ticket/booking)
  const hasBooking = await db.booking.findFirst({
    where: {
      eventId: id,
      userId: user.id,
      status: 'CONFIRMED',
    },
  })
  // For simplicity, require booking. Could also allow review without booking but not enforced now.
  if (!hasBooking) {
    return NextResponse.json({ error: 'You must have attended the event to leave a review' }, { status: 403 })
  }

  // Prevent duplicate reviews: one user per event
  const existing = await db.review.findFirst({
    where: { eventId: id, customerId: user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this event' }, { status: 400 })
  }

  const review = await db.review.create({
    data: {
      eventId: id,
      customerId: user.id,
      rating: data.rating,
      comment: data.comment || null,
    },
    include: {
      customer: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ review }, { status: 201 })
}
