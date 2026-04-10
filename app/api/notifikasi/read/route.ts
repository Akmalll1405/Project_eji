export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id

    await prisma.$queryRawUnsafe(`
      UPDATE "Notification" SET "isRead" = true
      WHERE "userId" = '${userId}'
    `)

    return NextResponse.json({ message: 'Semua notifikasi dibaca' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}