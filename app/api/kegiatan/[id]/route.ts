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

    const kegiatan = await prisma.$queryRawUnsafe(`
      UPDATE "Kegiatan" SET
        "namaKegiatan" = '${body.namaKegiatan}',
        "tanggalKegiatan" = '${new Date(body.tanggalKegiatan).toISOString()}',
        "fotoUrl" = ${body.fotoUrl ? `'${body.fotoUrl}'` : 'NULL'},
        "fotoName" = ${body.fotoName ? `'${body.fotoName}'` : 'NULL'}
      WHERE id = '${id}'
      RETURNING *
    `)

    return NextResponse.json(kegiatan)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.$queryRawUnsafe(`DELETE FROM "Kegiatan" WHERE id = '${id}'`)

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}