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

    const donor = await prisma.$queryRaw`
      UPDATE "Donor" SET
        "nama" = ${body.nama},
        "jenis" = ${body.jenis},
        "penanggungjawab" = ${body.penanggungjawab},
        "wilayah" = ${body.wilayah || ''},
        "alamat" = ${body.alamat || ''},
        "tahunPendirian" = ${parseInt(body.tahunPendirian || '0')}::integer,
        "lamaUsaha" = ${parseInt(body.lamaUsaha || '0')}::integer
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(donor)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.$queryRaw`DELETE FROM "Donor" WHERE id = ${id}`

    return NextResponse.json({ message: 'Donor berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}