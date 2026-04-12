'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'

interface Notif {
  id: string
  fileName: string
  proyekNama: string
  status: string
  catatanAdmin?: string
  isRead: boolean
  createdAt: string
  projectId: string
}

export default function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.isRead).length

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifikasi')
      const data = await res.json()
      setNotifs(Array.isArray(data) ? data : [])
    } catch { }
  }

  useEffect(() => {
    if (session) {
      fetchNotifs()
      const interval = setInterval(fetchNotifs, 15000)
      return () => clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpenNotif = async () => {
    setShowNotif(!showNotif)
    if (!showNotif && unread > 0) {
      await fetch('/api/notifikasi/read', { method: 'PUT' })
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      setTimeout(async () => {
        await fetch('/api/notifikasi', { method: 'DELETE' })
        fetchNotifs()
      }, 5000)
    }
  }
  return (
    <header
      className="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40"
      style={{
        background: 'rgba(3,7,18,0.85)',
        borderBottom: '1px solid rgba(37,99,235,0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 1px 40px rgba(37,99,235,0.08), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
    >
      {/* Logo dengan glow */}
      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 relative cursor-pointer"
        onClick={() => router.push('/dashboard')}>
        <Image
          src="/logopupuk.png"
          alt="Logo"
          fill
          sizes="40px"
          priority
          className="object-contain"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-2 flex-1 justify-end">
        <div className="hidden sm:block px-3 py-1 rounded-full text-xs text-gray-400 max-w-[160px] truncate"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {session?.user?.email}
        </div>

        {[
          { label: 'Home', path: '/dashboard' },
          { label: 'Report', path: '/report' },
        ].map(({ label, path }) => (
          <button key={path} onClick={() => router.push(path)}
            className="text-gray-400 hover:text-white text-xs sm:text-sm transition whitespace-nowrap"
            style={{ textShadow: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textShadow = '0 0 8px rgba(96,165,250,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.textShadow = 'none')}>
            {label}
          </button>
        ))}

        {(session?.user as any)?.role === 'ADMIN' && (
          <button onClick={() => router.push('/users')}
            className="text-gray-400 hover:text-white text-xs sm:text-sm transition whitespace-nowrap"
            onMouseEnter={e => (e.currentTarget.style.textShadow = '0 0 8px rgba(96,165,250,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.textShadow = 'none')}>
            Users
          </button>
        )}

        {/* Bell dengan glow */}
        <div className="relative" ref={notifRef}>
          <button onClick={handleOpenNotif}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition"
            style={{
              background: showNotif ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)',
              border: showNotif ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: showNotif ? '0 0 12px rgba(37,99,235,0.3)' : 'none'
            }}>
            <span className="text-sm">🔔</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                style={{
                  background: '#ef4444',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  boxShadow: '0 0 8px rgba(239,68,68,0.6)'
                }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {/* Dropdown tetap sama */}
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50"
              style={{
                background: '#0f172a',
                border: '1px solid rgba(37,99,235,0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.1)'
              }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-semibold text-white">Notifikasi</span>
                {unread > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                    {unread} baru
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-600 text-sm">Belum ada notifikasi</div>
                ) : notifs.map((n) => (
                  <button key={n.id}
                    onClick={() => { router.push(`/proyek/${n.projectId}`); setShowNotif(false) }}
                    className="w-full px-4 py-3 text-left transition hover:bg-white/[0.03]"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: !n.isRead ? 'rgba(37,99,235,0.04)' : 'transparent'
                    }}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {n.status === 'APPROVED' ? '✅' :
                          n.status === 'REJECTED' ? '❌' :
                            n.status === 'NEEDS_REVIEW' ? '📋' :
                              n.status === 'REQUEST_EDIT' ? '✏️' : '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-300 font-medium truncate">{n.fileName}</div>
                        <div className="text-xs text-gray-600 mt-0.5 truncate">{n.proyekNama}</div>
                        <div className={`text-xs mt-1 font-medium ${n.status === 'APPROVED' ? 'text-emerald-400' :
                          n.status === 'REJECTED' ? 'text-red-400' :
                            n.status === 'NEEDS_REVIEW' ? 'text-yellow-400' :
                              n.status === 'REQUEST_EDIT' ? 'text-purple-400' : 'text-gray-400'
                          }`}>
                          {n.status === 'APPROVED' ? '✅ Dokumen disetujui' :
                            n.status === 'REJECTED' ? '❌ Dokumen ditolak' :
                              n.status === 'NEEDS_REVIEW' ? '⏳ Dokumen butuh review' :
                                n.status === 'REQUEST_EDIT' ? '✏️ Permintaan edit proyek' : n.status}
                        </div>
                        {n.catatanAdmin && (
                          <div className="text-xs text-gray-500 mt-0.5 italic truncate">"{n.catatanAdmin}"</div>
                        )}
                        <div className="text-xs text-gray-700 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {!n.isRead && (
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: '#3b82f6', boxShadow: '0 0 6px rgba(59,130,246,0.8)' }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs sm:text-sm px-3 py-1.5 rounded-lg text-gray-300 transition whitespace-nowrap"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(239,68,68,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
          Logout
        </button>
      </div>
    </header>
  )
}