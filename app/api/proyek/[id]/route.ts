export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const proyek = await prisma.$queryRaw`
      SELECT p.*, u.name as "userName"
      FROM "Project" p
      LEFT JOIN "User" u ON p."userId" = u.id
      WHERE p.id = ${id}
    `

    return NextResponse.json(proyek)
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const nilai = body.nilai ? parseFloat(body.nilai) : 0
    const tanggalMulai = body.tanggalMulai ? new Date(body.tanggalMulai).toISOString() : new Date().toISOString()
    const tanggalSelesai = body.tanggalSelesai ? new Date(body.tanggalSelesai).toISOString() : null

    const proyek = await prisma.$queryRawUnsafe(`
      UPDATE "Project" SET
        "nama" = '${body.nama}',
        "jenis" = '${body.jenis}',
        "nilai" = ${nilai},
        "penanggungjawab" = '${body.penanggungjawab || ''}',
        "perusahaan" = '${body.perusahaan || ''}',
        "sektor" = '${body.sektor || ''}',
        "tanggalMulai" = '${tanggalMulai}',
        "tanggalSelesai" = ${tanggalSelesai ? `'${tanggalSelesai}'` : 'NULL'},
        "status" = '${body.status}'::"StatusProyek",
        "updatedAt" = NOW()
      WHERE id = '${id}'
      RETURNING *
    `)

    return NextResponse.json(proyek)
  } catch (error) {
    console.error('PUT Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    await prisma.$queryRaw`
      DELETE FROM "Project" WHERE id = ${id}
    `

    return NextResponse.json({ message: 'Proyek berhasil dihapus' })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}