export const dynamic = "force-dynamic";
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
    const jumlah = parseFloat(body.jumlah) || 0

    const safe = (s: string) => (s || '').replace(/'/g, "''")
    const tgl = (s: string) => s ? `'${new Date(s).toISOString()}'` : 'NULL'

    await prisma.$queryRawUnsafe(`
      UPDATE "Transaction" SET
        "jenisPembayaran" = '${safe(body.jenisPembayaran || 'TUNAI')}',
        "keterangan" = '${safe(body.keterangan || body.namaProgram || '')}',
        "jumlah" = ${jumlah},
        "tanggalPembayaran" = ${tgl(body.tanggalPengajuan || body.tanggalPembayaran)},
        "buktiBayarUrl" = ${body.buktiBayarUrl ? `'${body.buktiBayarUrl}'` : 'NULL'},
        "namaProgram" = '${safe(body.namaProgram || '')}',
        "kegiatan" = '${safe(body.kegiatan || '')}',
        "staffCA" = '${safe(body.staffCA || '')}',
        "tanggalPengajuan" = ${tgl(body.tanggalPengajuan)},
        "tanggalPertanggungjawaban" = ${tgl(body.tanggalPertanggungjawaban)},
        "kelengkapanDokumen" = '${safe(body.kelengkapanDokumen || 'Lengkap')}',
        "statusTransaksi" = '${safe(body.statusTransaksi || 'Transfer successful')}'
      WHERE id = '${id}'
    `)

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('PUT transaksi error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    await prisma.$queryRawUnsafe(`DELETE FROM "Transaction" WHERE id = '${id}'`)
    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}