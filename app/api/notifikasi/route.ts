import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id
    const role = (session.user as any).role

    const query = role === 'ADMIN'
      ? `
        SELECT n.*, p.nama as "proyekNama"
        FROM "Notification" n
        LEFT JOIN "Project" p ON n."projectId" = p.id
        WHERE n."userId" = '${userId}'
        ORDER BY n."createdAt" DESC
        LIMIT 100
      `
      : `
        SELECT n.*, p.nama as "proyekNama"
        FROM "Notification" n
        LEFT JOIN "Project" p ON n."projectId" = p.id
        WHERE n."userId" = '${userId}'
        AND n."status" NOT IN ('REQUEST_EDIT', 'REQUEST_APPROVAL', 'NEEDS_REVIEW')
        ORDER BY n."createdAt" DESC
        LIMIT 50
      `

    const notifs = await prisma.$queryRawUnsafe(query)
    return NextResponse.json(notifs)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as any).id

    await prisma.$queryRawUnsafe(`
      DELETE FROM "Notification"
      WHERE "userId" = '${userId}' AND "isRead" = true
    `)
    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}