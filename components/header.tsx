'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function Header() {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <header className="bg-blue-500 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">

      {/* LOGO */}
      <div className="flex-shrink-0">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <Image
            src="/logopupuk.png"
            alt="Logo"
            fill
            sizes='48px'
            loading='eager'
            priority
            className="object-contain rounded lg"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }}
          />
        </div>
      </div>

      {/* MENU */}
      <div className="flex items-center gap-2 sm:gap-4 ml-2 flex-1 justify-end">

        {/* EMAIL (hidden di mobile kecil) */}
        <div className="hidden sm:block bg-white rounded-full px-3 py-1 text-xs text-gray-600 max-w-[180px] truncate">
          {session?.user?.email}
        </div>

        {/* NAV */}
        <button
          onClick={() => router.push('/dashboard')}
          className="text-white text-xs sm:text-sm font-bold underline whitespace-nowrap"
        >
          Home
        </button>

        <button
          onClick={() => router.push('/report')}
          className="text-white text-xs sm:text-sm font-bold underline whitespace-nowrap"
        >
          Report
        </button>

        {(session?.user as any)?.role === 'ADMIN' && (
          <button
            onClick={() => router.push('/users')}
            className="text-white text-xs sm:text-sm font-bold underline whitespace-nowrap"
          >
            Users
          </button>
        )}

        {/* LOGOUT */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-white text-xs sm:text-sm border border-white px-2 py-1 rounded whitespace-nowrap hover:bg-blue-600 transition"
        >
          Logout
        </button>
      </div>
    </header>
  )
}