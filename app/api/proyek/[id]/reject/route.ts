import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    await prisma.$queryRawUnsafe(`
      DELETE FROM "Notification"
      WHERE "projectId" = '${id}'
      AND "status" IN ('REQUEST_EDIT', 'REQUEST_APPROVAL')
    `)

    const proyekData = await prisma.$queryRawUnsafe(`
      SELECT "userId", nama FROM "Project" WHERE id = '${id}' LIMIT 1
    `) as any[]

    if (proyekData.length > 0 && proyekData[0].userId) {
      const safeNama = (proyekData[0].nama || '').replace(/'/g, "''")
      await prisma.$queryRawUnsafe(`
        INSERT INTO "Notification" (
          "id", "userId", "projectId", "dokumenId",
          "fileName", "status", "catatanAdmin", "isRead", "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          '${proyekData[0].userId}',
          '${id}', '${id}',
          '${safeNama}',
          'REJECTED',
          'Permintaan ditolak oleh Admin',
          false, NOW()
        )
      `)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}