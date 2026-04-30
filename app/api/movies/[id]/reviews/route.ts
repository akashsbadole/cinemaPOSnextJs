import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

// GET /api/movies/[id]/reviews - Get reviews for movie
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const reviews = await db.movieReview.findMany({
    where: { movieId: id },
    include: {
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ reviews })
}

// POST /api/movies/[id]/reviews - Submit review
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const data = reviewSchema.parse(body)

  // Ensure user has attended the movie (has a booking)
  const hasBooking = await db.booking.findFirst({
    where: {
      show: {
        movieId: id,
      },
      OR: [
        { userId: user.id },
        { customerEmail: user.email }
      ],
      status: 'CONFIRMED',
    },
  })

  if (!hasBooking) {
    return NextResponse.json({ error: 'You must have booked this movie to leave a review' }, { status: 403 })
  }

  // Prevent duplicate reviews: one user per movie
  const existing = await db.movieReview.findFirst({
    where: { movieId: id, customerId: user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this movie' }, { status: 400 })
  }

  const review = await db.movieReview.create({
    data: {
      movieId: id,
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