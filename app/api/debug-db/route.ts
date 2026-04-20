import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.$queryRawUnsafe(`
      SELECT id, email, role FROM "User" LIMIT 3
    `) as any[]

    return NextResponse.json({
      ok: true,
      count: users.length,
      emails: users.map((u: any) => u.email),
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nextauthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: String(error),
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nextauthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    })
  }
}