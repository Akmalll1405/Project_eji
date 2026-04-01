import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await req.json()
    const transaksi = await prisma.$queryRawUnsafe(`
      UPDATE "Transaction" SET
        "jenisPembayaran" = '${body.jenisPembayaran}'::"JenisPembayaran",
        "keterangan" = '${body.keterangan}',
        "nomorRekening" = ${body.nomorRekening ? `'${body.nomorRekening}'` : 'NULL'},
        "bankTujuan" = ${body.bankTujuan ? `'${body.bankTujuan}'` : 'NULL'},
        "jumlah" = ${parseFloat(body.jumlah)},
        "tanggalPembayaran" = '${new Date(body.tanggalPembayaran).toISOString()}',
        "buktiBayarUrl" = ${body.buktiBayarUrl ? `'${body.buktiBayarUrl}'` : 'NULL'}
      WHERE id = '${id}'
      RETURNING *
    `)
    return NextResponse.json(transaksi)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await prisma.$queryRawUnsafe(`DELETE FROM "Transaction" WHERE id = '${id}'`)
    return NextResponse.json({ message: 'Transaksi berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}