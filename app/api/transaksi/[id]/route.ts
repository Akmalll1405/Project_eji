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

    const safe = (s: any): string => s != null ? String(s).replace(/'/g, "''") : ''
    const tgl  = (s: any): string => (s && String(s).trim()) ? `'${String(s).trim()}'` : 'NULL'

    if (body.statusApproval !== undefined) {
      const approvalStatus = safe(body.statusApproval)
      const catatan        = safe(body.catatanAdmin || '')

      await prisma.$queryRawUnsafe(`
        UPDATE "Transaction" SET
          "statusApproval" = '${approvalStatus}',
          "catatanAdmin"   = '${catatan}'
        WHERE id = '${id}'
      `)

      const rows = await prisma.$queryRawUnsafe(`
        SELECT
          t."namaProgram", t."keterangan", t."projectId",
          p."userId", p.nama as "proyekNama"
        FROM "Transaction" t
        JOIN "Project" p ON t."projectId" = p.id
        WHERE t.id = '${id}'
        LIMIT 1
      `) as any[]

      if (rows.length > 0) {
        const row     = rows[0]
        const adminId = (session.user as any).id
        const ownerId = row.userId

        if (ownerId && ownerId !== adminId) {
          const isClear      = approvalStatus === 'CLEAR'
          const notifStatus  = isClear ? 'APPROVED' : 'REJECTED'
          const namaProgram  = safe(row.namaProgram || row.keterangan || 'Transaksi')
          const catatanBody  = safe(body.catatanAdmin || (isClear ? 'Transaksi dinyatakan Clear' : 'Transaksi dinyatakan Not Clear'))
          const prefix       = isClear ? '💰 Keuangan Clear: ' : '💰 Keuangan Not Clear: '
          const catatanNotif = safe(prefix + (body.catatanAdmin || (isClear ? 'Transaksi dinyatakan Clear' : 'Transaksi dinyatakan Not Clear')))

          await prisma.$queryRawUnsafe(`
            INSERT INTO "Notification" (
              "id", "userId", "projectId", "dokumenId",
              "fileName", "status", "catatanAdmin", "isRead", "createdAt"
            ) VALUES (
              gen_random_uuid()::text,
              '${ownerId}',
              '${row.projectId}',
              '${id}',
              '${namaProgram}',
              '${notifStatus}',
              '${catatanNotif}',
              false, NOW()
            )
          `)
        }
      }

      return NextResponse.json({ message: 'Status approval diupdate' })
    }

    const jenisPembayaran = safe(body.jenisPembayaran) || 'TUNAI'
    const keterangan      = safe(body.keterangan)
    const jumlah          = parseFloat(body.jumlah) || 0
    const nomorRekening   = safe(body.nomorRekening)
    const bankTujuan      = safe(body.bankTujuan)
    const buktiBayarUrl   = body.buktiBayarUrl ? `'${safe(body.buktiBayarUrl)}'` : 'NULL'
    const namaProgram     = safe(body.namaProgram)
    const kegiatan        = safe(body.kegiatan)
    const staffCA         = safe(body.staffCA)
    const kelengkapan     = safe(body.kelengkapanDokumen) || 'Lengkap'
    const statusTrx       = safe(body.statusTransaksi) || 'Transfer successful'
    const tanggalBayar    = tgl(body.tanggalPembayaran)
    const tanggalAjuan    = tgl(body.tanggalPengajuan)
    const tanggalPJ       = tgl(body.tanggalPertanggungjawaban)

    await prisma.$queryRawUnsafe(`
      UPDATE "Transaction" SET
        "jenisPembayaran"            = '${jenisPembayaran}',
        "keterangan"                 = '${keterangan}',
        "jumlah"                     = ${jumlah},
        "nomorRekening"              = '${nomorRekening}',
        "bankTujuan"                 = '${bankTujuan}',
        "tanggalPembayaran"          = ${tanggalBayar},
        "buktiBayarUrl"              = ${buktiBayarUrl},
        "namaProgram"                = '${namaProgram}',
        "kegiatan"                   = '${kegiatan}',
        "staffCA"                    = '${staffCA}',
        "tanggalPengajuan"           = ${tanggalAjuan},
        "tanggalPertanggungjawaban"  = ${tanggalPJ},
        "kelengkapanDokumen"         = '${kelengkapan}',
        "statusTransaksi"            = '${statusTrx}'
      WHERE id = '${id}'
    `)

    return NextResponse.json({ message: 'Transaksi diupdate' })
  } catch (error) {
    console.error('PUT transaksi error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.$queryRawUnsafe(`DELETE FROM "Transaction" WHERE id = '${id}'`)
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}