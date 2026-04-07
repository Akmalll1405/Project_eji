export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const proyek = await prisma.$queryRawUnsafe(`
      SELECT p.*, u.name as "userName", u.id as "userId"
      FROM "Project" p
      LEFT JOIN "User" u ON p."userId" = u.id
      ORDER BY p."createdAt" DESC
    `)

    return NextResponse.json(proyek)
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const userId = (session.user as any).id

    const nilai = body.nilai ? parseFloat(body.nilai) : 0
    const tanggalMulai = body.tanggalMulai ? new Date(body.tanggalMulai).toISOString() : new Date().toISOString()
    const tanggalSelesai = body.tanggalSelesai ? new Date(body.tanggalSelesai).toISOString() : null

    const proyek = await prisma.$queryRawUnsafe(`
      INSERT INTO "Project" (
        "id", "nama", "jenis", "nilai", "penanggungjawab",
        "wilayah", "sektor", "tanggalMulai", "tanggalSelesai",
        "status", "userId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        '${body.nama}',
        '${body.jenis}',
        ${nilai},
        '${body.penanggungjawab || ''}',
        '${body.wilayah || ''}',
        '${body.sektor}',
        '${tanggalMulai}',
        ${tanggalSelesai ? `'${tanggalSelesai}'` : 'NULL'},
        '${body.status || 'PERENCANAAN'}'::"StatusProyek",
        '${userId}',
        NOW(),
        NOW()
      )
      RETURNING *
    `)

    return NextResponse.json(proyek)
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}