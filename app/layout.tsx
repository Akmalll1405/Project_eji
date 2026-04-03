import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Sistem Manajemen Proyek',
  description: 'Aplikasi manajemen proyek digital',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 overflow-x-hidden">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}