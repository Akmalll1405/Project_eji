import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.$queryRaw`DELETE FROM "Document" WHERE id = ${id}`

    return NextResponse.json({ message: 'Dokumen berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}