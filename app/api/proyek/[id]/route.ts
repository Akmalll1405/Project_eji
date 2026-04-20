export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

// GET /api/proyek/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: { user: { select: { name: true } } }
    })
    
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    
    return NextResponse.json(project, { 
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      
    const { id } = await params
    const body = await req.json()
    console.log('STATUS DIKIRIM:', body.status)
    const nilai = body.nilai ? parseFloat(body.nilai) : 0
    const tanggalMulai = body.tanggalMulai ? new Date(body.tanggalMulai).toISOString() : new Date().toISOString()
    const tanggalSelesai = body.tanggalSelesai ? new Date(body.tanggalSelesai).toISOString() : null

    const proyek = await prisma.$queryRawUnsafe(`
      UPDATE "Project" SET
        "nama" = '${body.nama}',
        "jenis" = '${body.jenis}',
        "nilai" = ${nilai},
        "penanggungjawab" = '${body.penanggungjawab || ''}',
        "wilayah" = '${body.wilayah || ''}',
        "sektor" = '${body.sektor || ''}',
        "tanggalMulai" = '${tanggalMulai}',
        "tanggalSelesai" = ${tanggalSelesai ? `'${tanggalSelesai}'` : 'NULL'},
        "status" = '${body.status}'::"StatusProyek",
        "updatedAt" = NOW()
      WHERE id = '${id}'
      RETURNING *
    `)
    console.log('HASIL UPDATE:', proyek)
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

    await prisma.$queryRawUnsafe(`DELETE FROM "Project" WHERE id = '${id}'`)

    return NextResponse.json({ message: 'Proyek berhasil dihapus' })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}