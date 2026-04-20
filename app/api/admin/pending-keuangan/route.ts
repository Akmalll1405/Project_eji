import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await prisma.$queryRawUnsafe(`
      SELECT
        t.id, t."namaProgram", t."keterangan", t."jumlah",
        t."staffCA", t."tanggalPengajuan", t."statusApproval",
        t."buktiBayarUrl", t."projectId",
        p.nama as "proyekNama",
        u.name as "uploaderName"
      FROM "Transaction" t
      JOIN "Project" p ON t."projectId" = p.id
      LEFT JOIN "User" u ON p."userId" = u.id
      WHERE (t."statusApproval" = 'PENDING' OR t."statusApproval" IS NULL)
      ORDER BY t."createdAt" DESC
      LIMIT 50
    `)

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}