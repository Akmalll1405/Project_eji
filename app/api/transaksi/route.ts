import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json([])

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

    const safe = (s: any): string => s != null ? String(s).replace(/'/g, "''") : ''
    const tgl  = (s: any): string => (s && String(s).trim()) ? `'${String(s).trim()}'` : 'NULL'

    const uploaderId  = (session.user as any).id
    const isAdminUser = (session.user as any).role === 'ADMIN'
    const id          = crypto.randomUUID()

    const nominalPJUM       = parseFloat(body.nominalPJUM) || 0
    const jenisPembayaran   = safe(body.jenisPembayaran) || 'TUNAI'
    const keterangan        = safe(body.keterangan)
    const jumlah            = parseFloat(body.jumlah) || 0
    const nomorRekening     = safe(body.nomorRekening)
    const bankTujuan        = safe(body.bankTujuan)
    const buktiBayarUrl     = body.buktiBayarUrl ? `'${safe(body.buktiBayarUrl)}'` : 'NULL'
    const namaProgram       = safe(body.namaProgram)
    const kegiatan          = safe(body.kegiatan)
    const staffCA           = safe(body.staffCA)
    const tanggalPembayaran = tgl(body.tanggalPembayaran)
    const tanggalPengajuan  = tgl(body.tanggalPengajuan)
    const tanggalPJ         = tgl(body.tanggalPertanggungjawaban)
    const kelengkapan       = safe(body.kelengkapanDokumen) || 'Lengkap'
    const statusTrx         = safe(body.statusTransaksi) || 'Transfer successful'
    const projectId         = safe(body.projectId)
    const userId            = safe(uploaderId)

    await prisma.$queryRawUnsafe(`
      INSERT INTO "Transaction" (
        id, "projectId", "userId",
        "jenisPembayaran", "keterangan", "jumlah",
        "nomorRekening", "bankTujuan", "tanggalPembayaran", "buktiBayarUrl",
        "namaProgram", "kegiatan", "staffCA",
        "tanggalPengajuan", "tanggalPertanggungjawaban",
        "kelengkapanDokumen", "statusTransaksi", "statusApproval",
        "createdAt", "nominalPJUM"
      ) VALUES (
        '${id}',
        '${projectId}',
        '${userId}',
        '${jenisPembayaran}',
        '${keterangan}',
        ${jumlah},
        ${nominalPJUM},
        '${nomorRekening}',
        '${bankTujuan}',
        ${tanggalPembayaran},
        ${buktiBayarUrl},
        '${namaProgram}',
        '${kegiatan}',
        '${staffCA}',
        ${tanggalPengajuan},
        ${tanggalPJ},
        '${kelengkapan}',
        '${statusTrx}',
        'PENDING',
        NOW()
      )
    `)

    // Kirim notif NEEDS_REVIEW ke semua admin jika yang tambah bukan admin
    if (!isAdminUser) {
      const proyekRows = await prisma.$queryRawUnsafe(`
        SELECT nama FROM "Project" WHERE id = '${projectId}' LIMIT 1
      `) as any[]

      const proyekNama   = safe(proyekRows[0]?.nama || 'Proyek')
      const namaTrx      = namaProgram || keterangan || 'Transaksi baru'
      const catatanNotif = safe(`Keuangan baru dari proyek: ${proyekRows[0]?.nama || 'Proyek'}`)

      const admins = await prisma.$queryRawUnsafe(`
        SELECT id FROM "User" WHERE role = 'ADMIN'
      `) as any[]

      for (const admin of admins) {
        await prisma.$queryRawUnsafe(`
          INSERT INTO "Notification" (
            "id", "userId", "projectId", "dokumenId",
            "fileName", "status", "catatanAdmin", "isRead", "createdAt"
          ) VALUES (
            gen_random_uuid()::text,
            '${admin.id}',
            '${projectId}',
            '${id}',
            '${namaTrx}',
            'NEEDS_REVIEW',
            '${catatanNotif}',
            false, NOW()
          )
        `)
      }
    }

    return NextResponse.json({ message: 'Created', id })
  } catch (error) {
    console.error('POST transaksi error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}