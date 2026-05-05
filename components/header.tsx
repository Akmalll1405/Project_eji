'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Bell, LogOut, Home, FileText, Users } from 'lucide-react'

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

const statusConfig: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Disetujui', color: '#10b981' },
  REJECTED: { label: 'Ditolak', color: '#ef4444' },
  NEEDS_REVIEW: { label: 'Butuh review', color: '#f59e0b' },
  REQUEST_EDIT: { label: 'Permintaan edit proyek', color: '#8b5cf6' },
  REQUEST_APPROVAL: { label: 'Permintaan persetujuan proyek', color: '#3b82f6' },
  UNLOCKED: { label: 'Proyek dibuka untuk diedit', color: '#06b6d4' },
}

const WEBSITE_NAME = 'SI-APUK'
const WEBSITE_TAGLINE = 'Sistem Informasi Arsip PUPUK'

export default function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [notifs, setNotifs] = useState<Notif[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const [showMenu, setShowMenu] = useState(false)   // mobile nav drawer

  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const unread = notifs.filter(n => !n.isRead).length

  // ── data fetching ──────────────────────────────────────────────
  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifikasi')
      const data = await res.json()
      setNotifs(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (!session) return
    fetchNotifs()
    const iv = setInterval(fetchNotifs, 15000)
    return () => clearInterval(iv)
  }, [session])

  // ── close on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── close menu on route change ────────────────────────────────
  const navigate = (path: string) => {
    router.push(path)
    setShowMenu(false)
    setShowNotif(false)
  }

  // ── open notif ────────────────────────────────────────────────
  const handleOpenNotif = async () => {
    const next = !showNotif
    setShowNotif(next)
    setShowMenu(false)
    if (next && unread > 0) {
      await fetch('/api/notifikasi/read', { method: 'PUT' })
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
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

  const markAllRead = async () => {
    await fetch('/api/notifikasi/read', { method: 'PUT' })
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setTimeout(async () => {
      await fetch('/api/notifikasi', { method: 'DELETE' })
      fetchNotifs()
      setShowNotif(false)
    }, 500)
  }

  // ── nav links list ────────────────────────────────────────────
  const navLinks = [
    { label: 'Home', path: '/dashboard', icon: <Home size={16} /> },
    { label: 'Report', path: '/report', icon: <FileText size={16} /> },
    ...(role === 'ADMIN'
      ? [{ label: 'Users', path: '/users', icon: <Users size={16} /> }]
      : []),
  ]

  return (
    <>
      <style>{`
        .hdr-root {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #002147;
          border-bottom: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 2px 16px rgba(0,0,0,0.25);
        }
        .hdr-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          height: 60px;
          max-width: 1280px;
          margin: 0 auto;
          min-width: 0;
        }
        /* Logo */
        .hdr-logo {
          flex-shrink: 0;
          width: 36px; height: 36px;
          cursor: pointer;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        /* Brand text */
        .hdr-brand {
          flex-shrink: 0;
          cursor: pointer;
          line-height: 1.2;
          margin-right: 4px;
          min-width: 0;
        }
        .hdr-brand-name {
          font-size: 15px; font-weight: 700;
          color: #fff; letter-spacing: 0.01em;
        }
        .hdr-brand-tagline {
          font-size: 11px; color: rgba(255,255,255,0.55);
          white-space: nowrap;
        }
        /* Spacer */
        .hdr-spacer { flex: 1; }
        /* Desktop nav */
        .hdr-nav {
          display: flex; align-items: center; gap: 2px; min-width: 0;
        }
        .hdr-nav-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.80);
          font-size: 13.5px; font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          flex-shrink: 1;
        }
        .hdr-nav-btn:hover {
          background: rgba(255,255,255,0.10);
          color: #fff;
        }
        /* Email pill */
        .hdr-email {
          max-width: 120px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 12.5px; color: rgba(255,255,255,0.70);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          padding: 6px 10px;
        }
        /* Icon button (bell, hamburger) */
        .hdr-icon-btn {
          position: relative;
          width: 40px; height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .hdr-icon-btn:hover, .hdr-icon-btn.active {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.28);
        }
        /* Unread badge */
        .hdr-badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 18px; height: 18px; padding: 0 4px;
          border-radius: 9px;
          background: #ef4444;
          border: 2px solid #002147;
          color: #fff;
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          line-height: 1;
        }
        /* Logout btn */
        .hdr-logout {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.20);
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .hdr-logout:hover { background: rgba(255,255,255,0.16); }

        /* Hide desktop nav on small screens */
        @media (max-width: 639px) {
          .hdr-desktop-only { display: none !important; }
          .hdr-brand-tagline { display: none; }
        }
        @media (min-width: 640px) {
          .hdr-mobile-only { display: none !important; }
        }

        /* ── Notif & Mobile menu dropdown ──────────────────────── */
        .hdr-dropdown-overlay {
          position: fixed; inset: 0; z-index: 48;
          background: rgba(0,0,0,0.30);
        }
        .hdr-dropdown {
          position: fixed;
          top: 60px; /* matches hdr-inner height */
          left: 0; right: 0;
          z-index: 49;
          padding: 8px 12px 12px;
        }
        .hdr-dropdown-inner {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(0,0,0,0.22);
          max-height: calc(100dvh - 80px);
          display: flex; flex-direction: column;
        }
        /* constrain to right on desktop */
        @media (min-width: 400px) {
          .hdr-dropdown { left: auto; width: 360px; right: 12px; }
        }
        .hdr-dd-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px 12px;
          border-bottom: 1px solid #f0f0f0;
          flex-shrink: 0;
        }
        .hdr-dd-title {
          font-size: 15px; font-weight: 700; color: #0e1523;
          display: flex; align-items: center; gap: 8px;
        }
        .hdr-dd-badge {
          font-size: 11px; font-weight: 700;
          background: #3b82f6; color: #fff;
          border-radius: 6px; padding: 2px 7px;
        }
        .hdr-dd-close {
          width: 30px; height: 30px; border-radius: 8px;
          border: none; background: #f5f5f5; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #555; transition: background 0.12s;
        }
        .hdr-dd-close:hover { background: #ebebeb; }
        .hdr-dd-list { overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; }
        .hdr-notif-item {
          width: 100%; text-align: left;
          padding: 13px 18px;
          border: none; cursor: pointer;
          border-bottom: 1px solid #f5f5f5;
          transition: background 0.12s;
          display: flex; gap: 12px; align-items: flex-start;
        }
        .hdr-notif-item:hover { background: #f8faff; }
        .hdr-notif-item.unread { background: #eff6ff; }
        .hdr-notif-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #3b82f6; flex-shrink: 0; margin-top: 5px;
        }
        .hdr-dd-footer {
          padding: 12px 18px;
          border-top: 1px solid #f0f0f0;
          flex-shrink: 0;
        }
        .hdr-dd-footer-btn {
          width: 100%; padding: 10px;
          border-radius: 10px; border: none;
          background: #f5f5f5; color: #444;
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.12s;
        }
        .hdr-dd-footer-btn:hover { background: #ebebeb; }
        .hdr-empty {
          padding: 40px 20px; text-align: center;
          color: #9ca3af; font-size: 14px;
        }
        @media (max-width: 900px) {
          .hdr-email {
            display: none;
          }
        }
        /* ── Mobile nav drawer ──────────────────────────────────── */
        .hdr-mobile-nav { display: flex; flex-direction: column; padding: 8px 0; }
        .hdr-mobile-nav-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 18px;
          border: none; background: transparent;
          color: #1a202c; font-size: 14px; font-weight: 500;
          cursor: pointer; text-align: left;
          transition: background 0.12s;
          border-bottom: 1px solid #f5f5f5;
        }
        .hdr-mobile-nav-btn:hover { background: #f8faff; }
        .hdr-mobile-nav-btn:last-child { border-bottom: none; }
        .hdr-mobile-email {
          padding: 12px 18px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 12.5px; color: #6b7280;
          word-break: break-all;
        }
        .hdr-mobile-logout {
          margin: 8px 12px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px;
          border-radius: 10px;
          border: none;
          background: #002147; color: #fff;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
        }
      `}</style>

      {/* ── HEADER BAR ───────────────────────────────────────────── */}
      <header className="hdr-root" ref={headerRef}>
        <div className="hdr-inner">

          {/* Logo */}
          <div className="hdr-logo" onClick={() => navigate('/dashboard')}>
            <Image src="/logopupuk.png" alt="Logo" width={32} height={32} priority style={{ objectFit: 'contain' }} />
          </div>

          {/* Brand */}
          <div className="hdr-brand" onClick={() => navigate('/dashboard')}>
            <div className="hdr-brand-name">{WEBSITE_NAME}</div>
            <div className="hdr-brand-tagline">{WEBSITE_TAGLINE}</div>
          </div>

          <div className="hdr-spacer" />

          {/* ── Desktop: email + nav + bell + logout ── */}
          <div className="hdr-nav hdr-desktop-only">
            <span className="hdr-email">{session?.user?.email}</span>
            {navLinks.map(({ label, path, icon }) => (
              <button key={path} className="hdr-nav-btn" onClick={() => navigate(path)}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Bell — always visible */}
          <div className="relative" ref={notifRef} style={{ position: 'relative' }}>
            <button
              className={`hdr-icon-btn${showNotif ? ' active' : ''}`}
              onClick={handleOpenNotif}
              aria-label="Notifikasi"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="hdr-badge">{unread > 9 ? '9+' : unread}</span>
              )}
            </button>
          </div>

          {/* Desktop logout */}
          <button className="hdr-logout hdr-desktop-only" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut size={14} />Logout
          </button>

          {/* Mobile hamburger */}
          <button
            className={`hdr-icon-btn hdr-mobile-only${showMenu ? ' active' : ''}`}
            onClick={() => { setShowMenu(p => !p); setShowNotif(false) }}
            aria-label="Menu"
          >
            {showMenu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* ── NOTIFICATION DROPDOWN ────────────────────────────────── */}
      {showNotif && (
        <>
          <div className="hdr-dropdown-overlay" onClick={() => setShowNotif(false)} />
          <div className="hdr-dropdown">
            <div className="hdr-dropdown-inner">
              <div className="hdr-dd-head">
                <div className="hdr-dd-title">
                  Notifikasi
                  {unread > 0 && <span className="hdr-dd-badge">{unread} baru</span>}
                </div>
                <button className="hdr-dd-close" onClick={() => setShowNotif(false)}>
                  <X size={14} />
                </button>
              </div>

              <div className="hdr-dd-list">
                {notifs.length === 0 ? (
                  <div className="hdr-empty">Belum ada notifikasi</div>
                ) : notifs.map(n => {
                  const cfg = statusConfig[n.status] || { label: n.status, color: '#3b82f6' }
                  return (
                    <button
                      key={n.id}
                      className={`hdr-notif-item${!n.isRead ? ' unread' : ''}`}
                      onClick={() => handleNotifClick(n)}
                    >
                      {!n.isRead && <div className="hdr-notif-dot" />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0e1523', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.fileName}
                        </div>
                        {n.proyekNama && (
                          <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                            {n.proyekNama}
                          </div>
                        )}
                        <div style={{ fontSize: 12, fontWeight: 600, color: cfg.color, marginTop: 3 }}>
                          {n.status === 'NEEDS_REVIEW'
                            ? (n.catatanAdmin?.startsWith('Keuangan baru') ? 'Keuangan butuh review' : 'Dokumen butuh review')
                            : cfg.label}
                        </div>
                        {n.catatanAdmin && (
                          <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{n.catatanAdmin}"
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                          {new Date(n.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {notifs.length > 0 && (
                <div className="hdr-dd-footer">
                  <button className="hdr-dd-footer-btn" onClick={markAllRead}>
                    Tandai semua sudah dibaca &amp; hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── MOBILE NAV DRAWER ────────────────────────────────────── */}
      {showMenu && (
        <>
          <div className="hdr-dropdown-overlay hdr-mobile-only" onClick={() => setShowMenu(false)} />
          <div className="hdr-dropdown hdr-mobile-only" style={{ width: '100%', left: 0, right: 0, padding: '8px 12px 12px' }}>
            <div className="hdr-dropdown-inner">
              {session?.user?.email && (
                <div className="hdr-mobile-email">{session.user.email}</div>
              )}
              <div className="hdr-mobile-nav">
                {navLinks.map(({ label, path, icon }) => (
                  <button key={path} className="hdr-mobile-nav-btn" onClick={() => navigate(path)}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              <button className="hdr-mobile-logout" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut size={15} />Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}