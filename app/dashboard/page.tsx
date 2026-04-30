'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Loading from '@/components/Loading'

interface Project {
  id: string
  nama: string
  jenis: string
  nilai: number
  penanggungjawab: string
  wilayah: string
  sektor: string
  tanggalMulai: string
  tanggalSelesai: string
  status: string
  userName: string
  updatedAt: string
  isApproved?: boolean
}

interface PendingDokumen {
  id: string
  fileName: string
  jenisDokumen: string
  tanggalUpload: string
  status: string
  fileUrl: string
  projectId: string
  proyekNama: string
  uploaderName: string
}

// ─── Design tokens ───
const C = {
  bg: '#f5f7ff',
  white: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  textSub: '#475569',
  textMute: '#94a3b8',
  blue: '#2563eb',
  blueDark: '#1d4ed8',
  blueBg: '#eff6ff',
  blueBd: '#bfdbfe',
  blueText: '#1d4ed8',
  green: '#16a34a',
  greenBg: '#f0fdf4',
  greenBd: '#bbf7d0',
  amber: '#d97706',
  amberBg: '#fffbeb',
  amberBd: '#fde68a',
  red: '#dc2626',
  redBg: '#fef2f2',
  redBd: '#fecaca',
  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
  purpleBd: '#ddd6fe',
}

const card: React.CSSProperties = {
  background: C.white,
  borderRadius: 14,
  border: `1px solid ${C.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(37,99,235,0.05)',
}

const inputSt: React.CSSProperties = {
  background: '#f8fafc',
  border: `1.5px solid ${C.border}`,
  color: C.text,
  fontSize: 13,
  borderRadius: 9,
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
}

// pill badge
const pill = (bg: string, color: string, bd: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: 11, padding: '3px 10px',
  borderRadius: 99, background: bg,
  color, border: `1px solid ${bd}`,
  fontWeight: 700, whiteSpace: 'nowrap',
})

// small action button
const btn = (bg: string, color: string, bd: string): React.CSSProperties => ({
  fontSize: 12, padding: '5px 13px',
  borderRadius: 8, background: bg,
  color, border: `1px solid ${bd}`,
  cursor: 'pointer', fontWeight: 600,
  minHeight: 'auto',
})

const panelBtn = (active: boolean): React.CSSProperties => ({
  width: '100%', display: 'flex',
  alignItems: 'center', justifyContent: 'space-between',
  padding: '13px 16px', borderRadius: 11,
  cursor: 'pointer', minHeight: 48,
  background: active ? C.blueBg : '#fafbff',
  border: `1px solid ${active ? C.blueBd : C.border}`,
  transition: 'all 0.15s',
})

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [requestEditList, setRequestEditList] = useState<any[]>([])
  const [showRequestPanel, setShowRequestPanel] = useState(false)
  const [unlockLoading, setUnlockLoading] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('SEMUA')
  const [searchNama, setSearchNama] = useState('')
  const [searchWilayah, setSearchWilayah] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showUserPanel, setShowUserPanel] = useState(false)
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [pendingKeuangan, setPendingKeuangan] = useState<any[]>([])
  const [showKeuanganPanel, setShowKeuanganPanel] = useState(false)
  const [requestApprovalList, setRequestApprovalList] = useState<any[]>([])
  const [showRequestApprovalPanel, setShowRequestApprovalPanel] = useState(false)
  const [approveProjectLoading, setApproveProjectLoading] = useState<string | null>(null)
  const [pendingDokumen, setPendingDokumen] = useState<PendingDokumen[]>([])
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null)
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    nama: '', jenis: '', nilai: '', penanggungjawab: '',
    wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN'
  })

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      fetchProjects()
      if (isAdmin) {
        fetchPendingDokumen(); fetchRequestEdit()
        fetchPendingKeuangan(); fetchRequestApproval()
      }
    }
  }, [status])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/proyek')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }

  const fetchPendingDokumen = async () => {
    if (!isAdmin) return
    try { const r = await fetch('/api/admin/pending-dokumen'); setPendingDokumen(await r.json()) } catch { }
  }

  const fetchRequestEdit = async () => {
    if (!isAdmin) return
    try {
      const r = await fetch('/api/notifikasi'); const d = await r.json()
      setRequestEditList(Array.isArray(d) ? d.filter((n: any) => n.status === 'REQUEST_EDIT') : [])
    } catch { }
  }

  const fetchPendingKeuangan = async () => {
    if (!isAdmin) return
    try { const r = await fetch('/api/admin/pending-keuangan'); setPendingKeuangan(await r.json()) } catch { }
  }

  const fetchRequestApproval = async () => {
    if (!isAdmin) return
    try {
      const r = await fetch('/api/notifikasi'); const d = await r.json()
      setRequestApprovalList(Array.isArray(d) ? d.filter((n: any) => n.status === 'REQUEST_APPROVAL') : [])
    } catch { }
  }

  const handleSubmit = async () => {
    if (!form.nama.trim()) { alert('Nama Program wajib diisi!'); return }
    if (!form.jenis.trim()) { alert('Deskripsi Program wajib diisi!'); return }
    if (!form.sektor.trim()) { alert('Sektor wajib diisi!'); return }
    if (!form.tanggalMulai) { alert('Tanggal Mulai wajib diisi!'); return }
    if (form.tanggalSelesai && new Date(form.tanggalSelesai) < new Date(form.tanggalMulai)) {
      alert('Tanggal Selesai tidak boleh sebelum Tanggal Mulai!'); return
    }
    await fetch('/api/proyek', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    setShowForm(false)
    setForm({ nama: '', jenis: '', nilai: '', penanggungjawab: '', wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN' })
    fetchProjects()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus program ini?')) return
    await fetch(`/api/proyek/${id}`, { method: 'DELETE' }); fetchProjects()
  }

  const handleQuickApproval = async (dokumenId: string, s: 'APPROVED' | 'REJECTED') => {
    setApprovalLoading(dokumenId)
    try {
      await fetch(`/api/dokumen/${dokumenId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s, catatanAdmin: catatanMap[dokumenId] || '' })
      })
      await fetchPendingDokumen(); await fetchProjects()
    } finally { setApprovalLoading(null) }
  }

  const handleUnlockProject = async (projectId: string, notifId: string) => {
    setUnlockLoading(projectId)
    try {
      await fetch(`/api/proyek/${projectId}/unlock`, { method: 'POST' })
      await Promise.all([fetchRequestEdit(), fetchProjects()])
      alert('Proyek berhasil dibuka!')
    } finally { setUnlockLoading(null) }
  }

  const handleRejectRequest = async (projectId: string) => {
    if (!confirm('Yakin tolak permintaan ini?')) return
    setUnlockLoading(projectId)
    try {
      const r = await fetch(`/api/proyek/${projectId}/reject`, { method: 'POST' })
      if (!r.ok) throw new Error(await r.text())
      await Promise.all([fetchRequestEdit(), fetchRequestApproval(), fetchProjects()])
    } catch (e: any) { alert('Gagal: ' + e.message) }
    finally { setUnlockLoading(null) }
  }

  const handleApproveProjectFromDashboard = async (projectId: string) => {
    setApproveProjectLoading(projectId)
    try {
      const r = await fetch(`/api/proyek/${projectId}/approve`, { method: 'POST' })
      if (!r.ok) throw new Error('Gagal')
      alert('✓ Proyek disetujui!')
      await Promise.all([fetchRequestApproval(), fetchProjects()])
    } catch { alert('Gagal menyetujui proyek') }
    finally { setApproveProjectLoading(null) }
  }

  const fmtRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (s: string) => {
    if (!s) return '-'
    const d = new Date(s)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + '\n' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
  const diffDays = (t: string) => t ? Math.ceil((new Date(t).getTime() - Date.now()) / 86400000) : 999

  const statusLabel: Record<string, string> = { PERENCANAAN: 'Draft', BERJALAN: 'Berjalan', SELESAI: 'Selesai' }
  const statusPill: Record<string, [string, string, string]> = {
    PERENCANAAN: ['#f1f5f9', '#64748b', '#cbd5e1'],
    BERJALAN: [C.blueBg, C.blueText, C.blueBd],
    SELESAI: [C.greenBg, C.green, C.greenBd],
  }

  const filtered = projects.filter(p =>
    (filterStatus === 'SEMUA' || p.status === filterStatus) &&
    (p.nama || '').toLowerCase().includes(searchNama.toLowerCase()) &&
    (p.wilayah || '').toLowerCase().includes(searchWilayah.toLowerCase())
  )

  const userMap: Record<string, { name: string; projects: Project[] }> = {}
  projects.forEach(p => {
    const k = p.userName || 'Unknown'
    if (!userMap[k]) userMap[k] = { name: k, projects: [] }
    userMap[k].projects.push(p)
  })
  const userEntries = Object.entries(userMap)

  if (status === 'loading' || loading) return <Loading />
  if (status === 'unauthenticated') return null

  const EmptyMsg = ({ text }: { text: string }) => (
    <div style={{ padding: '24px', textAlign: 'center', color: C.textMute, fontSize: 13 }}>✓ {text}</div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: C.bg }}>
      <Header />

      <main style={{
        maxWidth: 900, margin: '0 auto',
        padding: '1.5rem calc(1rem + env(safe-area-inset-left,0px)) calc(2rem + env(safe-area-inset-bottom,0px)) calc(1rem + env(safe-area-inset-right,0px))',
      }}>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Program', value: projects.length, color: C.blue, bg: C.blueBg, bd: C.blueBd },
            { label: 'Sedang Berjalan', value: projects.filter(p => p.status === 'BERJALAN').length, color: C.amber, bg: C.amberBg, bd: C.amberBd },
            { label: 'Selesai', value: projects.filter(p => p.status === 'SELESAI').length, color: C.green, bg: C.greenBg, bd: C.greenBd },
            { label: 'Hampir Selesai', value: projects.filter(p => { const d = diffDays(p.tanggalSelesai); return d <= 7 && d >= 0 && p.status !== 'SELESAI' }).length, color: C.red, bg: C.redBg, bd: C.redBd },
          ].map(({ label, value, color, bg, bd }) => (
            <div key={label} style={{ ...card, padding: '16px 20px', background: bg, border: `1px solid ${bd}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: C.textSub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              </div>
              <span style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ─── Panel Admin ─── */}
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>

            {/* ── Ringkasan Per User ── */}
            <div style={card}>
              <button onClick={() => setShowUserPanel(p => !p)} style={panelBtn(showUserPanel)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Ringkasan Per User</span>
                  <span style={pill(C.blueBg, C.blueText, C.blueBd)}>{userEntries.length} user</span>
                </div>
                <span style={{ fontSize: 11, color: C.textMute }}>{showUserPanel ? '▲' : '▼'}</span>
              </button>
              {showUserPanel && (
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {userEntries.length === 0 ? <EmptyMsg text="Belum ada data" /> : userEntries.map(([name, data]) => (
                    <div key={name} style={{ padding: '12px 16px', borderBottom: `1px solid #f8fafc` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={pill(C.blueBg, C.blueText, C.blueBd)}>{data.projects.filter(p => p.status === 'BERJALAN').length} berjalan</span>
                          <span style={pill(C.greenBg, C.green, C.greenBd)}>{data.projects.filter(p => p.status === 'SELESAI').length} selesai</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {data.projects.slice(0, 5).map(p => {
                          const [bg, tc, bd] = statusPill[p.status] || statusPill.PERENCANAAN
                          return (
                            <button key={p.id} onClick={() => router.push(`/proyek/${p.id}`)}
                              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: bg, border: `1px solid ${bd}`, color: tc, cursor: 'pointer', minHeight: 'auto' }}>
                              {p.nama.length > 25 ? p.nama.slice(0, 25) + '…' : p.nama}
                            </button>
                          )
                        })}
                        {data.projects.length > 5 && <span style={{ fontSize: 11, color: C.textMute, padding: '4px 6px' }}>+{data.projects.length - 5} lagi</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Permintaan Persetujuan Proyek ── */}
            <div style={card}>
              <button onClick={() => { setShowRequestApprovalPanel(p => !p); fetchRequestApproval() }} style={panelBtn(requestApprovalList.length > 0)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: requestApprovalList.length > 0 ? C.blueText : C.text }}>
                    Permintaan Persetujuan Proyek
                  </span>
                  {requestApprovalList.length > 0 && <span style={pill(C.blueBg, C.blueText, C.blueBd)}>{requestApprovalList.length}</span>}
                </div>
                <span style={{ fontSize: 11, color: C.textMute }}>{showRequestApprovalPanel ? '▲' : '▼'}</span>
              </button>
              {showRequestApprovalPanel && (
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {requestApprovalList.length === 0 ? <EmptyMsg text="Tidak ada permintaan persetujuan" /> : requestApprovalList.map(r => (
                    <div key={r.id} style={{ padding: '14px 16px', borderBottom: `1px solid #f8fafc` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{r.fileName}</div>
                      {r.catatanAdmin && <div style={{ fontSize: 12, color: C.textSub, fontStyle: 'italic', marginBottom: 6 }}>"{r.catatanAdmin}"</div>}
                      <div style={{ fontSize: 11, color: C.textMute, marginBottom: 10 }}>
                        {new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => router.push(`/proyek/${r.projectId}`)} style={btn(C.blueBg, C.blueText, C.blueBd)}>Lihat Proyek</button>
                        <button onClick={() => handleApproveProjectFromDashboard(r.projectId)} disabled={approveProjectLoading === r.projectId}
                          style={{ ...btn(C.greenBg, C.green, C.greenBd), opacity: approveProjectLoading === r.projectId ? 0.5 : 1 }}>
                          {approveProjectLoading === r.projectId ? '...' : '✓ Setujui Proyek'}
                        </button>
                        <button onClick={() => handleRejectRequest(r.projectId)} style={btn(C.redBg, C.red, C.redBd)}>✗ Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Permintaan Edit Proyek ── */}
            <div style={card}>
              <button onClick={() => { setShowRequestPanel(p => !p); fetchRequestEdit() }} style={panelBtn(requestEditList.length > 0)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: requestEditList.length > 0 ? C.purple : C.text }}>
                    Permintaan Edit Proyek
                  </span>
                  {requestEditList.length > 0 && <span style={pill(C.purpleBg, C.purple, C.purpleBd)}>{requestEditList.length}</span>}
                </div>
                <span style={{ fontSize: 11, color: C.textMute }}>{showRequestPanel ? '▲' : '▼'}</span>
              </button>
              {showRequestPanel && (
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {requestEditList.length === 0 ? <EmptyMsg text="Tidak ada permintaan edit" /> : requestEditList.map(r => (
                    <div key={r.id} style={{ padding: '14px 16px', borderBottom: `1px solid #f8fafc` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{r.fileName}</div>
                      {r.catatanAdmin && <div style={{ fontSize: 12, color: C.textSub, fontStyle: 'italic', marginBottom: 6 }}>"{r.catatanAdmin}"</div>}
                      <div style={{ fontSize: 11, color: C.textMute, marginBottom: 10 }}>
                        {new Date(r.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => router.push(`/proyek/${r.projectId}`)} style={btn(C.blueBg, C.blueText, C.blueBd)}>Lihat Proyek</button>
                        <button onClick={() => handleUnlockProject(r.projectId, r.id)} disabled={unlockLoading === r.projectId}
                          style={{ ...btn(C.greenBg, C.green, C.greenBd), opacity: unlockLoading === r.projectId ? 0.5 : 1 }}>
                          {unlockLoading === r.projectId ? '...' : '🔓 Izinkan Edit'}
                        </button>
                        <button onClick={() => handleRejectRequest(r.projectId)} style={btn(C.redBg, C.red, C.redBd)}>✗ Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Keuangan Pending ── */}
            <div style={card}>
              <button onClick={() => { setShowKeuanganPanel(p => !p); fetchPendingKeuangan() }} style={panelBtn(pendingKeuangan.length > 0)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: pendingKeuangan.length > 0 ? C.amber : C.text }}>
                    Keuangan Menunggu Review
                  </span>
                  {pendingKeuangan.length > 0 && <span style={pill(C.amberBg, C.amber, C.amberBd)}>{pendingKeuangan.length} pending</span>}
                </div>
                <span style={{ fontSize: 11, color: C.textMute }}>{showKeuanganPanel ? '▲' : '▼'}</span>
              </button>
              {showKeuanganPanel && (
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {pendingKeuangan.length === 0 ? <EmptyMsg text="Tidak ada keuangan pending" /> : pendingKeuangan.map(t => (
                    <div key={t.id} style={{ padding: '14px 16px', borderBottom: `1px solid #f8fafc` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{t.namaProgram || t.keterangan || '-'}</div>
                      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8 }}>
                        <button onClick={() => router.push(`/proyek/${t.projectId}`)} style={{ color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 600 }}>{t.proyekNama}</button>
                        {t.jumlah && <span style={{ marginLeft: 8, color: C.green, fontWeight: 700 }}>{fmtRp(t.jumlah)}</span>}
                      </div>
                      <button onClick={() => router.push(`/proyek/${t.projectId}`)} style={btn(C.blueBg, C.blueText, C.blueBd)}>Review →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Dokumen Pending ── */}
            <div style={card}>
              <button onClick={() => { setShowApprovalPanel(p => !p); if (!showApprovalPanel) fetchPendingDokumen() }} style={panelBtn(pendingDokumen.length > 0)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: pendingDokumen.length > 0 ? C.amber : C.text }}>
                    Dokumen Menunggu Approval
                  </span>
                  {pendingDokumen.length > 0 && <span style={pill(C.amberBg, C.amber, C.amberBd)}>{pendingDokumen.length} pending</span>}
                </div>
                <span style={{ fontSize: 11, color: C.textMute }}>{showApprovalPanel ? '▲' : '▼'}</span>
              </button>
              {showApprovalPanel && (
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {pendingDokumen.length === 0 ? <EmptyMsg text="Tidak ada dokumen pending" /> : pendingDokumen.map(d => (
                    <div key={d.id} style={{ padding: '14px 16px', borderBottom: `1px solid #f8fafc` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{d.fileName}</div>
                      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 2 }}>
                        <button onClick={() => router.push(`/proyek/${d.projectId}`)} style={{ color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 600 }}>{d.proyekNama}</button>
                        {' • '}{d.uploaderName}{' • '}{new Date(d.tanggalUpload).toLocaleDateString('id-ID')}
                      </div>
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, display: 'block', marginBottom: 8, fontWeight: 600 }}>Lihat File →</a>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Catatan (opsional)..."
                          value={catatanMap[d.id] || ''}
                          onChange={e => setCatatanMap(p => ({ ...p, [d.id]: e.target.value }))}
                          style={{ ...inputSt, flex: 1, minWidth: 110, fontSize: 12, padding: '6px 10px' }} />
                        <button onClick={() => handleQuickApproval(d.id, 'APPROVED')} disabled={approvalLoading === d.id}
                          style={{ ...btn(C.greenBg, C.green, C.greenBd), opacity: approvalLoading === d.id ? 0.5 : 1 }}>✓ Setujui</button>
                        <button onClick={() => handleQuickApproval(d.id, 'REJECTED')} disabled={approvalLoading === d.id}
                          style={btn(C.redBg, C.red, C.redBd)}>✗ Tolak</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Search ─── */}
        <div style={{ ...card, padding: '12px 16px', marginBottom: 14 }}>
          <div className="flex flex-col sm:flex-row gap-2">
            {[
              { ph: '🔍 Cari nama program...', val: searchNama, set: setSearchNama },
              { ph: '🔍 Cari wilayah...', val: searchWilayah, set: setSearchWilayah },
            ].map(({ ph, val, set }) => (
              <input key={ph} type="text" placeholder={ph} value={val}
                onChange={e => set(e.target.value)}
                style={{ ...inputSt, flex: 1 }} />
            ))}
            {(searchNama || searchWilayah) && (
              <button onClick={() => { setSearchNama(''); setSearchWilayah('') }}
                style={{ fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', minHeight: 'auto', whiteSpace: 'nowrap' }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ─── Filter + Tambah ─── */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          {['SEMUA', 'PERENCANAAN', 'BERJALAN', 'SELESAI'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', minHeight: 'auto', transition: 'all 0.15s',
                background: filterStatus === s ? C.blue : C.white,
                border: `1px solid ${filterStatus === s ? C.blue : C.border}`,
                color: filterStatus === s ? '#fff' : C.textSub,
                boxShadow: filterStatus === s ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
              }}>
              {s === 'SEMUA' ? 'Semua' : statusLabel[s]}
            </button>
          ))}
          <button onClick={() => setShowForm(true)}
            style={{
              marginLeft: 'auto', padding: '8px 18px', borderRadius: 10, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', minHeight: 'auto',
              background: `linear-gradient(135deg,${C.blue},${C.blueDark})`,
              border: 'none', color: '#fff',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}>
            + Tambah Program
          </button>
        </div>

        {/* ─── Card Layout (Desktop & Mobile) ─── */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center', color: C.textMute }}>Belum ada data program</div>
          ) : filtered.map((p, i) => {
            const d = diffDays(p.tanggalSelesai)
            const [bg, tc, bd] = statusPill[p.status] || statusPill.PERENCANAAN

            // Create unique keys for each field
            const projectFields = [
              { id: 'jenis', label: 'Deskripsi', value: p.jenis || '-', alwaysShow: true},
              { id: 'nilai', label: 'Nilai', value: p.nilai ? fmtRp(p.nilai) : '-', alwaysShow: true},
              {
                id: 'pm-wilayah',
                label: `PM • ${p.wilayah || ''}`,
                value: p.penanggungjawab || '-',
                alwaysShow: true
              },
              {
                id: 'creator',
                label: 'Dibuat oleh',
                value: p.userName || 'Unknown',
                alwaysShow: false
              },
              { id: 'updated', label: 'Diperbarui', value: fmtDate(p.updatedAt) },
            ].filter(item => {return item.alwaysShow || item.value !== '-'})

            return (
              <div key={p.id} style={{
                ...card,
                padding: 16,
                background: i % 2 === 0 ? '#fff' : '#fafbff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <button onClick={() => router.push(`/proyek/${p.id}`)}
                    style={{
                      color: C.blue,
                      fontWeight: 700,
                      fontSize: 14,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                      flex: 1,
                      minWidth: 0
                    }}>
                    {p.nama || '-'}
                  </button>
                  <span style={pill(bg, tc, bd)}>{statusLabel[p.status] || p.status}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2" style={{ marginBottom: 12 }}>
                  {projectFields.map(({ id, label, value }) => (
                    <div key={id} style={{ fontSize: 12 }}>
                      <span style={{ color: C.textMute, display: 'block', marginBottom: 2 }}>{label}:</span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: C.text,
                        lineHeight: 1.3
                      }}>
                        <span>{value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {(p as any).isApproved && <span style={pill(C.greenBg, C.green, C.greenBd)}>✓ Disetujui</span>}
                  {d <= 7 && d >= 0 && p.status !== 'SELESAI' && <span style={{ fontSize: 11, color: C.amber, fontWeight: 700 }}>⚠ {d} hari lagi</span>}
                  {d < 0 && p.status !== 'SELESAI' && <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>⚠ Lewat batas</span>}
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: `1px solid rgba(31, 63, 207, 0.6)`, paddingTop: 12 }}>
                  <button onClick={() => router.push(`/proyek/${p.id}`)} style={btn(C.blueBg, C.blueText, C.blueBd)}>Detail</button>
                  {isAdmin && <button onClick={() => handleDelete(p.id)} style={btn(C.redBg, C.red, C.redBd)}>Hapus</button>}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* ─── Modal Tambah ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }}>
          <div style={{ ...card, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, padding: '20px 24px', borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Tambah Program Baru</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {[
                  { lbl: 'Nama Program *', key: 'nama', type: 'text', full: true },
                  { lbl: 'Deskripsi Program *', key: 'jenis', type: 'text', full: false },
                  { lbl: 'Sektor *', key: 'sektor', type: 'text', full: false },
                  { lbl: 'Nilai Kontrak (Rp)', key: 'nilai', type: 'number', full: false },
                  { lbl: 'Program Manager', key: 'penanggungjawab', type: 'text', full: false },
                  { lbl: 'Wilayah', key: 'wilayah', type: 'text', full: false },
                  { lbl: 'Tanggal Mulai *', key: 'tanggalMulai', type: 'date', full: false },
                  { lbl: 'Tanggal Selesai', key: 'tanggalSelesai', type: 'date', full: false },
                ].map(({ lbl, key, type, full }) => (
                  <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>{lbl}</label>
                    <input type={type} value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ ...inputSt, fontSize: 14 }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ ...inputSt, fontSize: 14 }}>
                  <option value="PERENCANAAN">Draft</option>
                  <option value="BERJALAN">Sedang Berjalan</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleSubmit}
                  style={{ flex: 1, padding: 13, borderRadius: 11, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                  Simpan
                </button>
                <button onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: 13, borderRadius: 11, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}