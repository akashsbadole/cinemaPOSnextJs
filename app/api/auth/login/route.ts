// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { login, createToken } from '@/lib/auth'
import { z } from 'zod'
import { cookies } from 'next/headers'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)

    const user = await login(email, password)
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createToken({
      id: user.id, name: user.name, email: user.email, role: user.role, theaterId: user.theaterId,
    })

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, theaterId: user.theaterId },
    })

    response.cookies.set('cinepos-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })

    return response
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
