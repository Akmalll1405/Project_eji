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
      AND "status" = 'REQUEST_EDIT'
    `)

    const projekData = await prisma.$queryRawUnsafe(`
      SELECT p.id, p.nama, p."userId"
      FROM "Project" p
      WHERE p.id = '${id}'
      LIMIT 1
    `) as any[]

    if (projekData.length > 0) {
      const proyek = projekData[0]
      const safeNama = (proyek.nama || '').replace(/'/g, "''")

      await prisma.$queryRawUnsafe(`
        INSERT INTO "Notification" (
          "id", "userId", "projectId", "dokumenId", "fileName",
          "status", "catatanAdmin", "isRead", "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          '${proyek.userId}',
          '${id}',
          '${id}',
          '${safeNama}',
          'REJECTED',
          'Permintaan edit proyek ditolak oleh Admin',
          false,
          NOW()
        )
      `)
    }

    return NextResponse.json({ success: true, message: 'Permintaan edit ditolak' })
  } catch (error) {
    console.error('Reject error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}