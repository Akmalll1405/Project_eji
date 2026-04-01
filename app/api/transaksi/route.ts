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
    const transaksi = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Transaction" WHERE "projectId" = '${projectId}' ORDER BY "createdAt" DESC
    `)
    return NextResponse.json(transaksi)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const userId = (session.user as any).id
    const transaksi = await prisma.$queryRawUnsafe(`
      INSERT INTO "Transaction" (
        "id", "jenisPembayaran", "keterangan", "nomorRekening",
        "bankTujuan", "jumlah", "tanggalPembayaran", "buktiBayarUrl",
        "projectId", "userId", "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        '${body.jenisPembayaran}'::"JenisPembayaran",
        '${body.keterangan}',
        ${body.nomorRekening ? `'${body.nomorRekening}'` : 'NULL'},
        ${body.bankTujuan ? `'${body.bankTujuan}'` : 'NULL'},
        ${parseFloat(body.jumlah)},
        '${new Date(body.tanggalPembayaran).toISOString()}',
        ${body.buktiBayarUrl ? `'${body.buktiBayarUrl}'` : 'NULL'},
        '${body.projectId}',
        '${userId}',
        NOW()
      )
      RETURNING *
    `)
    return NextResponse.json(transaksi)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}