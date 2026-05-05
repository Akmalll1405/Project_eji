import type { NextConfig } from "next";
import next from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['@prisma/client'],
  }

export default nextConfig