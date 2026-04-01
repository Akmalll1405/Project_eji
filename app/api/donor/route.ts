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

    const donors = await prisma.$queryRaw`
      SELECT * FROM "Donor" WHERE "projectId" = ${projectId} ORDER BY "createdAt" DESC
    `

    return NextResponse.json(donors)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const donor = await prisma.$queryRaw`
      INSERT INTO "Donor" (
        "id", "nama", "jenis", "nilai", "penanggungjawab", 
        "wilayah", "alamat", "tahunPendirian", "lamaUsaha",
        "projectId", "createdAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${body.nama},
        ${body.jenis},
        ${parseFloat(body.nilai || '0')}::float,
        ${body.penanggungjawab},
        ${body.wilayah || ''},
        ${body.alamat || ''},
        ${parseInt(body.tahunPendirian || '0')}::integer,
        ${parseInt(body.lamaUsaha || '0')}::integer,
        ${body.projectId},
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json(donor)
  } catch (error) {
    console.error('POST Donor Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}