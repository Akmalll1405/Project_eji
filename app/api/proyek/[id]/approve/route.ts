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

    // 1. Lock project
    await prisma.$queryRawUnsafe(`
      UPDATE "Project"
      SET "isApproved" = true, "updatedAt" = NOW()
      WHERE id = '${id}'
    `)

    // 2. Ambil data project + owner
    const proyekRows = await prisma.$queryRawUnsafe(`
      SELECT p.id, p.nama, p."userId"
      FROM "Project" p
      WHERE p.id = '${id}'
      LIMIT 1
    `) as any[]

    if (proyekRows.length > 0) {
      const proyek  = proyekRows[0]
      const ownerId = proyek.userId
      const safeNama = (proyek.nama || '').replace(/'/g, "''")

      // 3. Kirim notif APPROVED ke owner
      if (ownerId) {
        await prisma.$queryRawUnsafe(`
          INSERT INTO "Notification" (
            "id", "userId", "projectId", "dokumenId",
            "fileName", "status", "catatanAdmin", "isRead", "createdAt"
          ) VALUES (
            gen_random_uuid()::text,
            '${ownerId}',
            '${id}',
            '${id}',
            '${safeNama}',
            'APPROVED',
            'Proyek kamu telah disetujui dan dikunci oleh Admin.',
            false, NOW()
          )
        `)
      }

      // 4. Hapus notif REQUEST_APPROVAL yang sudah diproses
      await prisma.$queryRawUnsafe(`
        DELETE FROM "Notification"
        WHERE "projectId" = '${id}'
        AND "status" = 'REQUEST_APPROVAL'
      `)
    }

    return NextResponse.json({ message: 'Proyek disetujui' })
  } catch (error) {
    console.error('Approve project error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}