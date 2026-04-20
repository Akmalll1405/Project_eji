import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const userId = (session.user as any).id
    const userName = ((session.user as any).name || 'User').replace(/'/g, "''")
    const note = (body.note || '').replace(/'/g, "''")
    const type = body.type || 'REQUEST_EDIT' // REQUEST_EDIT atau REQUEST_APPROVAL

    const proyek = await prisma.$queryRawUnsafe(`
      SELECT nama FROM "Project" WHERE id = '${id}'
    `) as any[]
    const proyekNama = (proyek[0]?.nama || 'Proyek').replace(/'/g, "''")

    const admins = await prisma.$queryRawUnsafe(`
      SELECT id FROM "User" WHERE role = 'ADMIN'
    `) as any[]

    for (const admin of admins) {
      const catatanNotif = type === 'REQUEST_APPROVAL'
        ? `${userName}: ${note || 'Mohon persetujuan proyek ini'}`
        : `${userName}: ${note || 'Mohon izin untuk edit proyek'}`

      await prisma.$queryRawUnsafe(`
        INSERT INTO "Notification" (
          "id", "userId", "projectId", "dokumenId", "fileName",
          "status", "catatanAdmin", "isRead", "createdAt"
        ) VALUES (
          gen_random_uuid()::text,
          '${admin.id}',
          '${id}',
          '${id}',
          '${proyekNama}',
          '${type}',
          '${catatanNotif}',
          false, NOW()
        )
      `)
    }

    return NextResponse.json({ message: 'Permintaan terkirim' })
  } catch (error) {
    console.error('Request error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}