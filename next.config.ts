import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Jangan tambahkan output: 'standalone' kecuali memang perlu
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig