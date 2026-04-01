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

    const dokumen = await prisma.$queryRaw`
      SELECT * FROM "Document" WHERE "projectId" = ${projectId} ORDER BY "tanggalUpload" DESC
    `

    return NextResponse.json(dokumen)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const dokumen = await prisma.$queryRaw`
      INSERT INTO "Document" (
        "id", "jenisDokumen", "fileUrl", "fileName", "projectId", "tanggalUpload"
      ) VALUES (
        gen_random_uuid()::text,
        ${body.jenisDokumen}::"JenisDokumen",
        ${body.fileUrl},
        ${body.fileName},
        ${body.projectId},
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json(dokumen)
  } catch (error) {
    console.error('POST Dokumen Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}