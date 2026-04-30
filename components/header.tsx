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
  const [headerHeight, setHeaderHeight] = useState(64)
  const headerRef = useRef<HTMLElement>(null)

  const website_name = "SI-APUK"
  const website_tagline = "Sistem Informasi Arsip PUPUK"

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

  // Hitung tinggi header untuk posisi dropdown
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
  }, [])

  // Tutup notif saat klik di luar
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
    setShowNotif(prev => !prev)
    if (!showNotif && unread > 0) {
      await fetch('/api/notifikasi/read', { method: 'PUT' })
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      // Hapus notif yang sudah dibaca setelah 3 detik
      setTimeout(async () => {
        await fetch('/api/notifikasi', { method: 'DELETE' })
        fetchNotifs()
      }, 3000)
    }
  }

  const handleNotifClick = (n: Notif) => {
    router.push(`/proyek/${n.projectId}`)
    setShowNotif(false)
  }

  const statusConfig: Record<string, { icon: string; label: string; color: string }> = {
    APPROVED: { icon: '✅', label: 'Disetujui', color: '#10b981' },
    REJECTED: { icon: '❌', label: 'Ditolak', color: '#ef4444' },
    NEEDS_REVIEW: { icon: '📋', label: 'Butuh review', color: '#f59e0b' },
    REQUEST_EDIT: { icon: '✏️', label: 'Permintaan edit proyek', color: '#8b5cf6' },
    REQUEST_APPROVAL: { icon: '📤', label: 'Permintaan persetujuan proyek', color: '#3b82f6' },
    UNLOCKED: { icon: '🔓', label: 'Proyek dibuka untuk diedit', color: '#06b6d4' },
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 flex items-center justify-between"
        style={{
          background: 'rgba(59, 130, 246, 0.95)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3), 0 2px 10px rgba(0, 0, 0, 0.1)',
          paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
          paddingBottom: '0.75rem',
          paddingLeft: 'calc(env(safe-area-inset-left) + 1.25rem)',
          paddingRight: 'calc(env(safe-area-inset-right) + 1.25rem)',
        }}
      >
        {/* Logo */}
        <div
          className="flex-shrink-0 relative cursor-pointer"
          onClick={() => router.push('/dashboard')}
          style={{ width: 44, height: 44 }}
        >
          <Image
            src="/logopupuk.png"
            alt="Logo"
            fill
            sizes="44px"
            priority
            className="object-contain rounded-xl"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))' }}
          />
        </div>
        {/*website Name */}
        <div className= "hidden sm:block">
          <div
            className="font-bold text-lg leading-tight cursor-pointer hover:opacity-90 transition-opacity"
            style={{ color: 'white' }}
            onClick={() => router.push('/dashboard')}
            >
              {website_name}
            </div>
            {website_tagline && (
              <div
                className= "text-xs font-medium leading-tight cursor-pointer hover:opacity-90 transition-opacity"
                style={{ color: 'rgba(255, 255, 255, 0.8'}}
                onClick={() => router.push('/dashboard')}
              >
                {website_tagline}
                </div>
            )}
        </div>
        {/* Nav links + Bell */}
        <div className="flex items-center gap-2 sm:gap-4 ml-4 flex-1 justify-end">
          {/* Email — hidden di mobile kecil */}
          <div className="hidden sm:block px-3 py-2 rounded-xl text-sm text-white/90 font-medium max-w-[160px] truncate backdrop-blur-sm"
            style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
            {session?.user?.email}
          </div>

          {/* Nav buttons - NO BOX */}
          {[
            { label: 'Home', path: '/dashboard' },
            { label: 'Report', path: '/report' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="text-white/90 hover:text-white font-medium text-sm transition-all duration-200 whitespace-nowrap px-3 py-2 rounded-xl hover:scale-105"
              style={{ minHeight: '44px' }}
            >
              {label}
            </button>
          ))}

          {(session?.user as any)?.role === 'ADMIN' && (
            <button
              onClick={() => router.push('/users')}
              className="text-white/90 hover:text-white font-medium text-sm transition-all duration-200 whitespace-nowrap px-3 py-2 rounded-xl hover:scale-105"
              style={{ minHeight: '44px' }}
            >
              Users
            </button>
          )}

          {/* Bell Notifikasi */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotif}
              className="relative flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 group"
              style={{
                width: 44,
                height: 44,
                background: showNotif 
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : 'rgba(255, 255, 255, 0.15)',
                border: showNotif 
                  ? '1px solid rgba(255, 255, 255, 0.4)' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: showNotif 
                  ? '0 4px 16px rgba(59, 130, 246, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <span style={{ fontSize: 18 }}>🔔</span>
              {unread > 0 && (
                <span
                  className="absolute flex items-center justify-center text-white font-bold shadow-lg"
                  style={{
                    top: -2, right: -2,
                    width: 20, height: 20,
                    borderRadius: '50%',
                    background: '#ef4444',
                    fontSize: 10,
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
                  }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm font-medium px-4 py-2 rounded-xl text-white transition-all duration-200 hover:scale-105 shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              minHeight: '44px',
              boxShadow: '0 2px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dropdown Notifikasi — FIXED, full width, iOS-safe */}
      {showNotif && (
        <>
          {/* Overlay transparan untuk tutup saat tap di luar */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowNotif(false)}
          />

          {/* Panel notifikasi */}
          <div
            className="fixed z-50"
            style={{
              top: headerHeight,
              left: 'calc(env(safe-area-inset-left) + 12px)',
              right: 'calc(env(safe-area-inset-right) + 12px)',
            }}
          >
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '0 20px 40px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)',
                maxHeight: '65dvh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header panel */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"
                style={{ borderBottom: '1px solid rgba(59, 130, 246, 0.15)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">Notifikasi</span>
                  {unread > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500 text-white font-semibold">
                      {unread} baru
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotif(false)}
                  className="flex items-center justify-center rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
                  style={{
                    width: 36, height: 36,
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* List notif */}
              <div
                className="overflow-y-auto flex-1"
                style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                {notifs.length === 0 ? (
                  <div className="px-8 py-12 text-center">
                    <div className="text-4xl mb-4 mx-auto w-20 h-20 flex items-center justify-center rounded-2xl bg-blue-100 mb-4">
                      🔔
                    </div>
                    <div className="text-gray-600 text-lg font-medium mb-1">Belum ada notifikasi</div>
                    <div className="text-gray-500 text-sm">Notifikasi akan muncul di sini</div>
                  </div>
                ) : notifs.map((n) => {
                  const cfg = statusConfig[n.status] || { icon: '🔔', label: n.status, color: '#3b82f6' }
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="w-full text-left transition-all duration-200 hover:bg-blue-50 group"
                      style={{
                        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                        background: !n.isRead ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        minHeight: '72px',
                        padding: '16px 20px',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1 w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200"
                          style={{ fontSize: 20 }}>
                          {cfg.icon}
                        </div>

                        {/* Konten */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate mb-1">
                            {n.fileName}
                          </div>
                          {n.proyekNama && (
                            <div className="text-sm text-gray-600 mb-1 truncate">
                              {n.proyekNama}
                            </div>
                          )}
                          <div className="text-sm font-semibold mb-1" style={{ color: cfg.color }}>
                            {n.status === 'NEEDS_REVIEW'
                            ? (n.catatanAdmin?.startsWith('Keuangan baru')
                                ?'Keuangan butuh review'
                                : 'Dokumen butuh review')
                              : cfg.label}
                          </div>
                          {n.catatanAdmin && (
                            <div className="text-xs text-gray-500 italic truncate bg-gray-100 px-2 py-1 rounded-lg">
                              "{n.catatanAdmin}"
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(n.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!n.isRead && (
                          <div
                            className="flex-shrink-0 rounded-full mt-2 shadow-lg"
                            style={{
                              width: 10, height: 10,
                              background: '#3b82f6',
                              boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
                            }}
                          />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Footer — tandai semua sudah dibaca */}
              {notifs.length > 0 && (
                <div
                  className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50"
                  style={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)' }}
                >
                  <button
                    onClick={async () => {
                      await fetch('/api/notifikasi/read', { method: 'PUT' })
                      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
                      setTimeout(async () => {
                        await fetch('/api/notifikasi', { method: 'DELETE' })
                        fetchNotifs()
                        setShowNotif(false)
                      }, 500)
                    }}
                    className="w-full text-sm font-semibold text-gray-700 hover:text-blue-600 transition-all duration-200 py-2.5 rounded-2xl hover:bg-white hover:shadow-md"
                  >
                    Tandai semua sudah dibaca & hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}