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

    const data = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Transaction"
      WHERE "projectId" = '${projectId}'
      ORDER BY "createdAt" DESC
    `)

    return NextResponse.json(data)
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
    const jumlah = parseFloat(body.jumlah) || 0

    const safe = (s: string) => (s || '').replace(/'/g, "''")
    const tgl = (s: string) => s ? `'${new Date(s).toISOString()}'` : 'NULL'

    await prisma.$queryRawUnsafe(`
      INSERT INTO "Transaction" (
        "id", "jenisPembayaran", "keterangan", "nomorRekening", "bankTujuan",
        "jumlah", "tanggalPembayaran", "buktiBayarUrl", "projectId", "userId", "createdAt",
        "namaProgram", "kegiatan", "staffCA", "tanggalPengajuan",
        "tanggalPertanggungjawaban", "kelengkapanDokumen", "statusTransaksi"
      ) VALUES (
        gen_random_uuid()::text,
        '${safe(body.jenisPembayaran || 'TUNAI')}',
        '${safe(body.keterangan || body.namaProgram || '')}',
        '${safe(body.nomorRekening || '')}',
        '${safe(body.bankTujuan || '')}',
        ${jumlah},
        ${tgl(body.tanggalPengajuan || body.tanggalPembayaran)},
        ${body.buktiBayarUrl ? `'${body.buktiBayarUrl}'` : 'NULL'},
        '${body.projectId}',
        '${userId}',
        NOW(),
        '${safe(body.namaProgram || '')}',
        '${safe(body.kegiatan || '')}',
        '${safe(body.staffCA || '')}',
        ${tgl(body.tanggalPengajuan)},
        ${tgl(body.tanggalPertanggungjawaban)},
        '${safe(body.kelengkapanDokumen || 'Lengkap')}',
        '${safe(body.statusTransaksi || 'Transfer successful')}'
      )
    `)

    return NextResponse.json({ message: 'OK' })
  } catch (error) {
    console.error('POST transaksi error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}