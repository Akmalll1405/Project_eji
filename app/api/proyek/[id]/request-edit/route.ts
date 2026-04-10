export const dynamic = "force-dynamic";

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
    const note = (body.note || '').replace(/'/g, "''")

    // Ambil semua admin
    const admins = await prisma.$queryRawUnsafe(`
      SELECT id FROM "User" WHERE role = 'ADMIN'
    `) as any[]

    const proyek = await prisma.$queryRawUnsafe(`
      SELECT nama FROM "Project" WHERE id = '${id}'
    `) as any[]

    const proyekNama = proyek[0]?.nama || 'Proyek'

    // Kirim notifikasi ke semua admin
    for (const admin of admins) {
      await prisma.$queryRawUnsafe(`
        INSERT INTO "Notification" ("id", "userId", "projectId", "dokumenId", "fileName", "status", "catatanAdmin", "isRead", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          '${admin.id}',
          '${id}',
          '${id}',
          'Request Edit: ${proyekNama.replace(/'/g, "''")}',
          'REQUEST_EDIT',
          ${note ? `'${note}'` : 'NULL'},
          false,
          NOW()
        )
      `)
    }

    return NextResponse.json({ message: 'Permintaan edit terkirim ke admin' })
  } catch (error) {
    console.error('Request edit error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}