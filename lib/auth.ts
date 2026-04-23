// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from './db'
import bcrypt from 'bcryptjs'

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-key-32-chars-long!!'
)

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('cinepos-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email, active: true } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null
  return user
}

export function canAccess(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 5,
  THEATER_OWNER: 4,
  VENDOR: 3,
  MANAGER: 2,
  CLERK: 1,
  CUSTOMER: 0,
}

export function hasPermission(userRole: string, minRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0)
}
