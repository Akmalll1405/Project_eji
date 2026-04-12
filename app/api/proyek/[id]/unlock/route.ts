import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    await prisma.$queryRawUnsafe(`
      UPDATE "Document" SET "status" = 'PENDING'
      WHERE "projectId" = '${id}' AND "status" = 'APPROVED'
    `)

    await prisma.$queryRawUnsafe(`
      DELETE FROM "Notification"
      WHERE "projectId" = '${id}' AND "status" = 'REQUEST_EDIT'
    `)

    return NextResponse.json({ message: 'Project berhasil dibuka' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}