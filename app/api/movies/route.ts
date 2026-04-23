// app/api/movies/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().min(1),
  genre: z.string().optional(),
  language: z.string().default('Hindi'),
  format: z.string().default('2D'),
  rating: z.string().optional(),
  posterUrl: z.string().optional(),
  trailerUrl: z.string().optional(),
  releaseDate: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')
    const search = searchParams.get('search')

    const movies = await db.movie.findMany({
      where: {
        ...(active === 'true' ? { active: true } : {}),
        ...(search ? { title: { contains: search } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ movies })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'VENDOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const movie = await db.movie.create({
      data: {
        ...data,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      },
    })
    return NextResponse.json({ movie }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
