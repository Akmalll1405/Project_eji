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

    const kegiatan = await prisma.$queryRawUnsafe(`
      SELECT * FROM "Kegiatan" 
      WHERE "projectId" = '${projectId}' 
      ORDER BY "tanggalKegiatan" DESC
    `)

    return NextResponse.json(kegiatan)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const kegiatan = await prisma.$queryRawUnsafe(`
      INSERT INTO "Kegiatan" (
        "id", "namaKegiatan", "tanggalKegiatan", 
        "fotoUrl", "fotoName", "projectId", "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        '${body.namaKegiatan}',
        '${new Date(body.tanggalKegiatan).toISOString()}',
        ${body.fotoUrl ? `'${body.fotoUrl}'` : 'NULL'},
        ${body.fotoName ? `'${body.fotoName}'` : 'NULL'},
        '${body.projectId}',
        NOW()
      )
      RETURNING *
    `)

    return NextResponse.json(kegiatan)
  } catch (error) {
    console.error('POST Kegiatan Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}