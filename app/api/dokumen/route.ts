export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    const dokumen = await prisma.$queryRawUnsafe(`
      SELECT d.*, u.name as "approvedByName"
      FROM "Document" d
      LEFT JOIN "User" u ON d."approvedBy" = u.id
      WHERE d."projectId" = '${projectId}'
      ORDER BY d."tanggalUpload" DESC
    `)

    return NextResponse.json(dokumen)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const uploaderId = (session.user as any).id

    const jenisDokumen = (body.jenisDokumen || '').replace(/'/g, "''")
    const fileUrl = (body.fileUrl || '').replace(/'/g, "''")
    const fileName = (body.fileName || '').replace(/'/g, "''")
    const projectId = (body.projectId || '').replace(/'/g, "''")

    // Insert dokumen
    const result = await prisma.$queryRawUnsafe(`
      INSERT INTO "Document" (
        "id", "jenisDokumen", "fileUrl", "fileName", "projectId",
        "tanggalUpload", "status"
      ) VALUES (
        gen_random_uuid()::text,
        '${jenisDokumen}',
        '${fileUrl}',
        '${fileName}',
        '${projectId}',
        NOW(),
        'PENDING'
      )
      RETURNING id
    `) as any[]

    const dokumenId = result[0]?.id

    // Ambil nama proyek
    const proyekData = await prisma.$queryRawUnsafe(`
      SELECT nama FROM "Project" WHERE id = '${projectId}'
    `) as any[]
    const proyekNama = (proyekData[0]?.nama || 'Proyek').replace(/'/g, "''")

    // Kirim notifikasi ke semua Admin
    const admins = await prisma.$queryRawUnsafe(`
      SELECT id FROM "User" WHERE role = 'ADMIN' AND id != '${uploaderId}'
    `) as any[]

    for (const admin of admins) {
      await prisma.$queryRawUnsafe(`
        INSERT INTO "Notification" (
          "id","userId","projectId","dokumenId","fileName","status","catatanAdmin","isRead","createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        '${admin.id}',
        '${projectId}',
        '${dokumenId}',
        '${fileName}',
        'NEEDS_REVIEW',
        'Dokumen baru dari proyek: ${proyekNama}',
        false, NOW()
       )
    `)
  }
    return NextResponse.json({ message: 'Dokumen berhasil diupload' })
  } catch (error) {
    console.error('POST dokumen error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
