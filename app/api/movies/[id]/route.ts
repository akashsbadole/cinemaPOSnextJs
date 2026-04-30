// app/api/movies/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const movie = await db.movie.findUnique({
      where: { id },
      include: {
        shows: {
          where: { startTime: { gte: new Date() }, status: { not: 'CANCELLED' } },
          include: { screen: { include: { theater: true } } },
          orderBy: { startTime: 'asc' },
          take: 20,
        },
        movieReviews: {
          include: { customer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
    if (!movie) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ movie })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const movie = await db.movie.update({
      where: { id },
      data: { ...body, releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined },
    })
    return NextResponse.json({ movie })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !hasPermission(user.role, 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { id } = await params
    await db.movie.update({ where: { id }, data: { active: false } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
