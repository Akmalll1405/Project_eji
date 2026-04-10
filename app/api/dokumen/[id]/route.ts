export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await prisma.$queryRawUnsafe(`DELETE FROM "Document" WHERE id = '${id}'`)
    return NextResponse.json({ message: 'Dokumen berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const approvedBy = (session.user as any).id
    const now = new Date().toISOString()
    const catatan = body.catatanAdmin ? body.catatanAdmin.replace(/'/g, "''") : null

    console.log('=== APPROVAL START ===')
    console.log('dokumenId:', id)
    console.log('status:', body.status)

    // Update status dokumen
    await prisma.$queryRawUnsafe(`
      UPDATE "Document" SET
        "status" = '${body.status}',
        "catatanAdmin" = ${catatan ? `'${catatan}'` : 'NULL'},
        "approvedAt" = '${now}',
        "approvedBy" = '${approvedBy}'
      WHERE id = '${id}'
    `)

    console.log('Document updated successfully')

    // Ambil info dokumen + userId pemilik project
    const dokumenData = await prisma.$queryRawUnsafe(`
      SELECT 
        d.id as "dokumenId",
        d."fileName",
        d."projectId",
        p."userId" as "ownerId",
        p.nama as "proyekNama"
      FROM "Document" d
      LEFT JOIN "Project" p ON d."projectId" = p.id
      WHERE d.id = '${id}'
    `) as any[]

    console.log('Dokumen data:', JSON.stringify(dokumenData))

    if (dokumenData && dokumenData.length > 0) {
      const dok = dokumenData[0]
      const fileName = (dok.fileName || 'dokumen').replace(/'/g, "''")
      const ownerId = dok.ownerId
      const projectId = dok.projectId

      console.log('Sending notification to userId:', ownerId)

      if (ownerId) {
        // Buat notifikasi
        await prisma.$queryRawUnsafe(`
          INSERT INTO "Notification" (
            "id", "userId", "projectId", "dokumenId",
            "fileName", "status", "catatanAdmin", "isRead", "createdAt"
          ) VALUES (
            gen_random_uuid()::text,
            '${ownerId}',
            '${projectId}',
            '${id}',
            '${fileName}',
            '${body.status}',
            ${catatan ? `'${catatan}'` : 'NULL'},
            false,
            NOW()
          )
        `)
        console.log('Notification sent!')
      } else {
        console.log('WARNING: ownerId is null, notification not sent')
      }
    }

    return NextResponse.json({ message: 'Status dokumen diupdate dan notifikasi terkirim' })
  } catch (error) {
    console.error('PUT dokumen error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}