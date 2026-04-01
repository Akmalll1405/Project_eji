export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Auto update status proyek yang sudah melewati tanggal selesai
    await prisma.$queryRawUnsafe(`
      UPDATE "Project" 
      SET "status" = 'SELESAI', "updatedAt" = NOW()
      WHERE "tanggalSelesai" < NOW() 
      AND "status" != 'SELESAI'
    `)

    const proyek = await prisma.$queryRawUnsafe(`
      SELECT p.*, u.name as "userName", u.id as "userId"
      FROM "Project" p
      LEFT JOIN "User" u ON p."userId" = u.id
      ORDER BY p."createdAt" DESC
    `)

    return NextResponse.json(proyek)
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

    console.log('userId:', userId)
    console.log('body:', body)

    const proyek = await prisma.$queryRaw`
      INSERT INTO "Project" (
        "id", "nama", "jenis", "nilai", "penanggungjawab", 
        "perusahaan", "sektor", "tanggalMulai", "tanggalSelesai", 
        "status", "userId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${body.nama},
        ${body.jenis},
        ${parseFloat(body.nilai)}::float,
        ${body.penanggungjawab},
        ${body.perusahaan},
        ${body.sektor},
        ${new Date(body.tanggalMulai)},
        ${new Date(body.tanggalSelesai)},
        ${body.status || 'PERENCANAAN'}::"StatusProyek",
        ${userId},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json(proyek)
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}