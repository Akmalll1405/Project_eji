import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = (session.user as any).role
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const pending = await prisma.$queryRawUnsafe(`
      SELECT 
        d.id,
        d."fileName",
        d."jenisDokumen",
        d."tanggalUpload",
        d."status",
        d."fileUrl",
        p.id as "projectId",
        p.nama as "proyekNama",
        u.name as "uploaderName",
        u.email as "uploaderEmail"
      FROM "Document" d
      LEFT JOIN "Project" p ON d."projectId" = p.id
      LEFT JOIN "User" u ON p."userId" = u.id
      WHERE d."status" = 'PENDING'
      ORDER BY d."tanggalUpload" ASC
    `)

    return NextResponse.json(pending)
  } catch (error) {
    console.error('GET pending dokumen error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}