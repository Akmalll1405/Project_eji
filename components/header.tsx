'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function Header() {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <header
      className="px-4 sm:px-6 py-3 flex items-center justify-between"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 relative cursor-pointer" onClick={() => router.push('/dashboard')}>
        <Image
          src="/logopupuk.png"
          alt="Logo"
          fill
          sizes="40px"
          priority
          className="object-contain"
          style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }}
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-2 flex-1 justify-end">
        <div className="hidden sm:block px-3 py-1 rounded-full text-xs text-gray-400 max-w-[180px] truncate"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {session?.user?.email}
        </div>
        {[
          { label: 'Home', path: '/dashboard' },
          { label: 'Report', path: '/report' },
        ].map(({ label, path }) => (
          <button key={path} onClick={() => router.push(path)}
            className="text-gray-400 hover:text-white text-xs sm:text-sm transition whitespace-nowrap">
            {label}
          </button>
        ))}
        {(session?.user as any)?.role === 'ADMIN' && (
          <button onClick={() => router.push('/users')}
            className="text-gray-400 hover:text-white text-xs sm:text-sm transition whitespace-nowrap">
            Users
          </button>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs sm:text-sm px-3 py-1.5 rounded-lg text-gray-300 transition whitespace-nowrap"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          Logout
        </button>
      </div>
    </header>
  )
}