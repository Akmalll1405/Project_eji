export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'  // ?unread=true

    let whereClause = `"userId" = '${userId}'`
    if (unreadOnly) {
      whereClause += ` AND "isRead" = false`
    }

    const notifs = await prisma.$queryRawUnsafe(`
      SELECT 
        n.*,
        p.nama as "proyekNama",
        p."userId" as "proyekOwnerId",
        d."jenisDokumen",
        d."fileName",
        d."status" as "dokumenStatus",
        u.name as "uploaderName"
      FROM "Notification" n
      LEFT JOIN "Project" p ON n."projectId" = p.id
      LEFT JOIN "Document" d ON n."dokumenId" = d.id
      LEFT JOIN "User" u ON p."userId" = u.id
      WHERE ${whereClause}
      ORDER BY n."createdAt" DESC
      LIMIT 50
    `) as any[]

    // ✅ Format untuk frontend
    const formattedNotifs = notifs.map((notif: any) => ({
      ...notif,
      // Status display yang user-friendly
      displayStatus: notif.dokumenStatus || notif.status || 'PENDING',
      // Icon dan color berdasarkan status
      icon: notif.dokumenStatus === 'APPROVED' ? '✅' : 
            notif.dokumenStatus === 'REJECTED' ? '❌' : '⏳',
      color: notif.dokumenStatus === 'APPROVED' ? 'emerald' :
             notif.dokumenStatus === 'REJECTED' ? 'red' : 'yellow',
      // Preview message yang lebih jelas
      previewMessage: notif.catatanAdmin || 
                     `Dokumen "${notif.fileName || 'Baru'}" menunggu persetujuan`
    }))

    return NextResponse.json(formattedNotifs)
  } catch (error) {
    console.error('GET notifikasi error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id
    const body = await req.json()
    const { ids } = body  // Array of notification IDs

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const idsString = ids.map(id => `'${id}'`).join(',')
    
    await prisma.$queryRawUnsafe(`
      UPDATE "Notification" 
      SET "isRead" = true 
      WHERE "id" IN (${idsString}) AND "userId" = '${userId}'
    `)

    return NextResponse.json({ message: 'Notifikasi marked as read' })
  } catch (error) {
    console.error('PUT notifikasi error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as any).id
    const notifId = params.id

    await prisma.$queryRawUnsafe(`
      DELETE FROM "Notification" 
      WHERE "id" = '${notifId}' AND "userId" = '${userId}'
    `)

    return NextResponse.json({ message: 'Notifikasi deleted' })
  } catch (error) {
    console.error('DELETE notifikasi error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}