import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10)
      await prisma.$queryRawUnsafe(`
        UPDATE "User" SET
          "name" = '${body.name}',
          "email" = '${body.email}',
          "role" = '${body.role}'::"Role",
          "password" = '${hashedPassword}'
        WHERE id = '${id}'
      `)
    } else {
      await prisma.$queryRawUnsafe(`
        UPDATE "User" SET
          "name" = '${body.name}',
          "email" = '${body.email}',
          "role" = '${body.role}'::"Role"
        WHERE id = '${id}'
      `)
    }

    return NextResponse.json({ message: 'User berhasil diupdate' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const currentUserId = (session.user as any).id

    if (id === currentUserId) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
    }

    await prisma.$queryRawUnsafe(`DELETE FROM "User" WHERE id = '${id}'`)

    return NextResponse.json({ message: 'User berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}