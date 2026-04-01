import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.$queryRawUnsafe(`
      SELECT id, name, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC
    `)

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const hashedPassword = await bcrypt.hash(body.password, 10)

    const user = await prisma.$queryRawUnsafe(`
      INSERT INTO "User" ("id", "name", "email", "password", "role", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        '${body.name}',
        '${body.email}',
        '${hashedPassword}',
        '${body.role}'::"Role",
        NOW()
      )
      RETURNING id, name, email, role, "createdAt"
    `)

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}