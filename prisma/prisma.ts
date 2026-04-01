import { PrismaClient } from "@prisma/client"

const glovalforPrisma = globalThis as unknown as{
    prisma: PrismaClient | undefined
}

export const prisma =
    glovalforPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') glovalforPrisma.prisma = prisma
