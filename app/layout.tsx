import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Manajemen Proyek',
  description: 'Aplikasi Manajemen Proyek',
  appleWebApp: {
    capable: true,
    title: 'Manajemen Proyek',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" style={{ background: '#f0f4ff' }}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className} style={{ background: '#f0f4ff', minHeight: '100dvh' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}