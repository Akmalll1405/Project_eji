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
    APPROVED: { icon: '✅', label: 'Disetujui', color: '#34d399' },
    REJECTED: { icon: '❌', label: 'Ditolak', color: '#f87171' },
    NEEDS_REVIEW: { icon: '📋', label: 'Butuh review', color: '#facc15' },
    REQUEST_EDIT: { icon: '✏️', label: 'Permintaan edit proyek', color: '#a78bfa' },
    REQUEST_APPROVAL: { icon: '📤', label: 'Permintaan persetujuan proyek', color: '#34d399' },
  UNLOCKED:         { icon: '🔓', label: 'Proyek dibuka untuk diedit',    color: '#60a5fa' },
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 flex items-center justify-between"
        style={{
          background: 'rgba(3,7,18,0.9)',
          borderBottom: '1px solid rgba(37,99,235,0.15)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 1px 30px rgba(37,99,235,0.08)',
          paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)',
          paddingBottom: '0.6rem',
          paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)',
          paddingRight: 'calc(env(safe-area-inset-right) + 1rem)',
        }}
      >
        {/* Logo */}
        <div
          className="flex-shrink-0 relative cursor-pointer"
          onClick={() => router.push('/dashboard')}
          style={{ width: 36, height: 36 }}
        >
          <Image
            src="/logopupuk.png"
            alt="Logo"
            fill
            sizes="36px"
            priority
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.7))' }}
          />
        </div>

        {/* Nav links + Bell */}
        <div className="flex items-center gap-1 sm:gap-3 ml-2 flex-1 justify-end">
          {/* Email — hidden di mobile kecil */}
          <div className="hidden sm:block px-3 py-1 rounded-full text-xs text-gray-400 max-w-[140px] truncate"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {session?.user?.email}
          </div>

          {/* Nav buttons */}
          {[
            { label: 'Home', path: '/dashboard' },
            { label: 'Report', path: '/report' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => router.push(path)}
              className="text-gray-400 hover:text-white text-xs sm:text-sm transition whitespace-nowrap px-1"
              style={{ minHeight: '44px' }}
            >
              {label}
            </button>
          ))}

          {(session?.user as any)?.role === 'ADMIN' && (
            <button
              onClick={() => router.push('/users')}
              className="text-gray-400 hover:text-white text-xs sm:text-sm transition whitespace-nowrap px-1"
              style={{ minHeight: '44px' }}
            >
              Users
            </button>
          )}

          {/* Bell Notifikasi */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotif}
              className="relative flex items-center justify-center rounded-xl transition"
              style={{
                width: 40,
                height: 40,
                background: showNotif ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)',
                border: showNotif ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: showNotif ? '0 0 12px rgba(37,99,235,0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: 16 }}>🔔</span>
              {unread > 0 && (
                <span
                  className="absolute flex items-center justify-center text-white font-bold"
                  style={{
                    top: -4, right: -4,
                    width: 18, height: 18,
                    borderRadius: '50%',
                    background: '#ef4444',
                    fontSize: 9,
                    boxShadow: '0 0 8px rgba(239,68,68,0.6)',
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
            className="text-xs sm:text-sm px-2 sm:px-3 rounded-xl text-gray-300 transition whitespace-nowrap"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              minHeight: '40px',
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
            className="fixed inset-0 z-40"
            onClick={() => setShowNotif(false)}
          />

          {/* Panel notifikasi */}
          <div
            className="fixed z-50"
            style={{
              top: headerHeight,
              left: 'calc(env(safe-area-inset-left) + 8px)',
              right: 'calc(env(safe-area-inset-right) + 8px)',
            }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#0d1424',
                border: '1px solid rgba(37,99,235,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.08)',
                maxHeight: '65dvh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header panel */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Notifikasi</span>
                  {unread > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      {unread} baru
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNotif(false)}
                  className="flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 transition"
                  style={{
                    width: 32, height: 32,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 12,
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
                  <div className="px-4 py-10 text-center">
                    <div className="text-2xl mb-2">🔔</div>
                    <div className="text-gray-600 text-sm">Belum ada notifikasi</div>
                  </div>
                ) : notifs.map((n) => {
                  const cfg = statusConfig[n.status] || { icon: '🔔', label: n.status, color: '#9ca3af' }
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="w-full text-left transition"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: !n.isRead ? 'rgba(37,99,235,0.05)' : 'transparent',
                        minHeight: '64px',
                        padding: '12px 16px',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <span className="flex-shrink-0 mt-0.5" style={{ fontSize: 20 }}>
                          {cfg.icon}
                        </span>

                        {/* Konten */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-200 truncate">
                            {n.fileName}
                          </div>
                          {n.proyekNama && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {n.proyekNama}
                            </div>
                          )}
                          <div className="text-xs font-medium mt-1" style={{ color: cfg.color }}>
                            {n.status === 'NEEDS_REVIEW'
                            ? (n.catatanAdmin?.startsWith('Keuangan baru')
                                ?'Keuangan butuh review'
                                : 'Dokumen butuh review')
                              : cfg.label}
                          </div>
                          {n.catatanAdmin && (
                            <div className="text-xs text-gray-500 mt-0.5 italic truncate">
                              "{n.catatanAdmin}"
                            </div>
                          )}
                          <div className="text-xs text-gray-700 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {/* Unread dot */}
                        {!n.isRead && (
                          <div
                            className="flex-shrink-0 rounded-full mt-1"
                            style={{
                              width: 8, height: 8,
                              background: '#3b82f6',
                              boxShadow: '0 0 6px rgba(59,130,246,0.8)',
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
                  className="flex-shrink-0 px-4 py-2"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
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
                    className="w-full text-xs text-gray-500 hover:text-gray-300 transition py-1"
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