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
  const [pendingDokumen, setPendingDokumen] = useState<PendingDokumen[]>([])
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null)
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    nama: '', jenis: '', nilai: '', penanggungjawab: '',
    wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN'
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      fetchProjects()
      fetchPendingDokumen()
      fetchRequestEdit()
    }
  }, [status])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/proyek')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDokumen = async () => {
    if ((session?.user as any)?.role !== 'ADMIN') return
    try {
      const res = await fetch('/api/admin/pending-dokumen')
      const data = await res.json()
      setPendingDokumen(Array.isArray(data) ? data : [])
    } catch { }
  }

  const handleSubmit = async () => {
    if (!form.nama.trim()) { alert('Nama Pekerjaan wajib diisi!'); return }
    if (!form.jenis.trim()) { alert('Jenis Pekerjaan wajib diisi!'); return }
    if (!form.sektor.trim()) { alert('Sektor wajib diisi!'); return }
    if (!form.tanggalMulai) { alert('Tanggal Mulai wajib diisi!'); return }
    if (form.tanggalSelesai && new Date(form.tanggalSelesai) < new Date(form.tanggalMulai)) {
      alert('Tanggal Selesai tidak boleh sebelum Tanggal Mulai!')
      return
    }
    await fetch('/api/proyek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setShowForm(false)
    resetForm()
    fetchProjects()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pekerjaan ini?')) return
    await fetch(`/api/proyek/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  const handleQuickApproval = async (dokumenId: string, approvalStatus: 'APPROVED' | 'REJECTED') => {
    setApprovalLoading(dokumenId)
    try {
      const res = await fetch(`/api/dokumen/${dokumenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: approvalStatus, catatanAdmin: catatanMap[dokumenId] || '' })
      })
      if (!res.ok) throw new Error('Gagal')
      await fetchPendingDokumen()
      await fetchProjects()
    } catch {
      alert('Gagal update status dokumen')
    } finally {
      setApprovalLoading(null)
    }
  }

  const handleUnlockProject = async (projectId: string, notifId: string) => {
    setUnlockLoading(projectId)
    try {
      const unlockRes = await fetch(`/api/proyek/${projectId}/unlock`, {
        method: 'POST'
      })
      if (!unlockRes.ok) {
        throw new Error('Failed to unlock project')
      }

      try {
        await fetch('/api/notifikasi/read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifId })
        })
      } catch (readError) {
        console.warn('Failed to mark notification as read:', readError)
      }

      await Promise.all([
        fetchRequestEdit(),
        fetchProjects()
      ])

      alert('Proyek berhasil dibuka untuk diedit!')
    } catch (error) {
      console.error('Error unlocking project:', error)
      alert('Gagal membuka proyek')
    } finally {
      setUnlockLoading(null)
    }
  }

const handleRejectRequest = async (projectId: string) => {
  if (!confirm('Yakin tolak permintaan edit ini?')) return
  setUnlockLoading(projectId)
  try {
    const response = await fetch(`/api/proyek/${projectId}/reject`, {
      method: 'POST'   
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || 'Gagal reject')
    }

    await Promise.all([fetchRequestEdit(), fetchProjects()])
    alert('Permintaan edit ditolak')
  } catch (error: any) {
    console.error('Reject error:', error)
    alert('Gagal menolak: ' + error.message)
  } finally {
    setUnlockLoading(null)
  }
}

  const fetchRequestEdit = async () => {
    if ((session?.user as any)?.role !== 'ADMIN') return
    try {
      const res = await fetch('/api/notifikasi')
      const data = await res.json()
      const requests = Array.isArray(data)
        ? data.filter((n: any) => n.status === 'REQUEST_EDIT')
        : []
      setRequestEditList(requests)
    } catch { }
  }
  const resetForm = () => {
    setForm({ nama: '', jenis: '', nilai: '', penanggungjawab: '', wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN' })
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID').format(num)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      '\n' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const statusLabel: Record<string, string> = {
    PERENCANAAN: 'Draft', BERJALAN: 'Sedang Diproses', SELESAI: 'Selesai'
  }

  const filtered = projects.filter(p => {
    const matchStatus = filterStatus === 'SEMUA' || p.status === filterStatus
    const matchNama = (p.nama || '').toLowerCase().includes(searchNama.toLowerCase())
    const matchWilayah = (p.wilayah || '').toLowerCase().includes(searchWilayah.toLowerCase())
    return matchStatus && matchNama && matchWilayah
  })

  const getDiffDays = (tanggalSelesai: string) => {
    if (!tanggalSelesai) return 999
    return Math.ceil((new Date(tanggalSelesai).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }

  // Hitung ringkasan per user
  const userMap: Record<string, { name: string; projects: Project[] }> = {}
  projects.forEach(p => {
    const key = p.userName || 'Unknown'
    if (!userMap[key]) userMap[key] = { name: key, projects: [] }
    userMap[key].projects.push(p)
  })
  const userEntries = Object.entries(userMap)

  if (status === 'loading' || loading) return <Loading />
  if (status === 'unauthenticated') return null

  return (
    <div style={{ minHeight: '100dvh', background: '#030712' }}>
      <Header />

      <main className="px-4 sm:px-6 py-4 sm:py-6"
          style={{
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
            paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
            paddingRight: 'calc(1rem + env(safe-area-inset-right))',}}>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Proyek', value: projects.length, color: '#f9fafb' },
            { label: 'Sedang Berjalan', value: projects.filter(p => p.status === 'BERJALAN').length, color: '#60a5fa' },
            { label: 'Selesai', value: projects.filter(p => p.status === 'SELESAI').length, color: '#34d399' },
            { label: 'Hampir Selesai', value: projects.filter(p => { const d = getDiffDays(p.tanggalSelesai); return d <= 7 && d >= 0 && p.status !== 'SELESAI' }).length, color: '#fb923c' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Panel Admin */}
        {(session?.user as any)?.role === 'ADMIN' && (
          <div className="mb-4 space-y-2">

            {/* Ringkasan Per User */}
            <div>
              <button onClick={() => setShowUserPanel(prev => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400">Ringkasan Per User</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                    {userEntries.length} user
                  </span>
                </div>
                <span className="text-gray-600 text-xs">{showUserPanel ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
              </button>

              {showUserPanel && (
                <div className="mt-1 rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  {userEntries.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-600 text-sm">Belum ada data</div>
                  ) : userEntries.map(([name, data]) => (
                    <div key={name} className="px-4 py-3 hover:bg-white/[0.02] transition"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'rgba(37,99,235,0.4)' }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-300 font-medium">{name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">{data.projects.length} proyek</span>
                          <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                            {data.projects.filter(p => p.status === 'BERJALAN').length} berjalan
                          </span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                            {data.projects.filter(p => p.status === 'SELESAI').length} selesai
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.projects.slice(0, 5).map(p => (
                          <button key={p.id} onClick={() => router.push(`/proyek/${p.id}`)}
                            className="text-xs px-2 py-1 rounded-lg transition hover:opacity-80"
                            style={{
                              background: p.status === 'BERJALAN' ? 'rgba(37,99,235,0.1)' : p.status === 'SELESAI' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
                              border: p.status === 'BERJALAN' ? '1px solid rgba(37,99,235,0.2)' : p.status === 'SELESAI' ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.07)',
                              color: p.status === 'BERJALAN' ? '#60a5fa' : p.status === 'SELESAI' ? '#34d399' : '#9ca3af'
                            }}>
                            {p.nama.length > 25 ? p.nama.slice(0, 25) + '...' : p.nama}
                          </button>
                        ))}
                        {data.projects.length > 5 && (
                          <span className="text-xs text-gray-600 px-2 py-1">+{data.projects.length - 5} lagi</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <button onClick={() => { setShowRequestPanel(!showRequestPanel); fetchRequestEdit() }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition"
                style={{
                  background: requestEditList.length > 0 ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                  border: requestEditList.length > 0 ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                <div className="flex item-center gap-2">
                  <span className="text-sm font-medium" style={{ color: requestEditList.length > 0 ? '#a78bfa' : '#9ca3af' }}>
                    Permintaan Edit Proyek
                  </span>
                  {requestEditList.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                      {requestEditList.length} permintaan
                    </span>
                  )}
                </div>
                <span className="text-gray-600 text-xs">{showRequestPanel ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
              </button>

              {showRequestPanel && (
                <div className="mt-1 rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  {requestEditList.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-600 text-sm">
                      ✓ Tidak ada permintaan edit
                    </div>
                  ) : requestEditList.map((r) => (
                    <div key={r.id} className="px-4 py-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                      <div className="mb-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-gray-200">{r.fileName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                            Request Edit
                          </span>
                        </div>
                        {r.catatanAdmin && (
                          <div className="text-xs text-gray-400 mt-1 italic">"{r.catatanAdmin}"</div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(r.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => router.push(`/proyek/${r.projectId}`)}
                          className="text-xs px-3 py-1.5 rounded-lg transition text-blue-400 hover:text-blue-300"
                          style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}>
                          Lihat Proyek
                        </button>
                        <button
                          onClick={() => handleUnlockProject(r.projectId, r.id)}
                          disabled={unlockLoading === r.projectId}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
                          {unlockLoading === r.projectId ? '...' : 'Izinkan Edit'}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(r.projectId)}
                          disabled={unlockLoading === r.projectId}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171'
                          }}>
                          {unlockLoading === r.projectId ? '...' : 'Tolak'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel Dokumen Pending */}
            <div>
              <button onClick={() => { setShowApprovalPanel(!showApprovalPanel); if (!showApprovalPanel) fetchPendingDokumen() }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition"
                style={{
                  background: pendingDokumen.length > 0 ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.03)',
                  border: pendingDokumen.length > 0 ? '1px solid rgba(234,179,8,0.25)' : '1px solid rgba(255,255,255,0.06)'
                }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: pendingDokumen.length > 0 ? '#facc15' : '#9ca3af' }}>
                    Dokumen Menunggu Approval
                  </span>
                  {pendingDokumen.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(234,179,8,0.2)', color: '#facc15' }}>
                      {pendingDokumen.length} pending
                    </span>
                  )}
                </div>
                <span className="text-gray-600 text-xs">{showApprovalPanel ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
              </button>

              {showApprovalPanel && (
                <div className="mt-1 rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  {pendingDokumen.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-600 text-sm">
                      ✓ Tidak ada dokumen yang menunggu approval
                    </div>
                  ) : pendingDokumen.map((d) => (
                    <div key={d.id} className="px-4 py-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                      <div className="mb-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-gray-200 truncate">{d.fileName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">⏳ Pending</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Proyek:{' '}
                          <button onClick={() => router.push(`/proyek/${d.projectId}`)}
                            className="text-blue-400 hover:text-blue-300 transition">{d.proyekNama}</button>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          Oleh: <span className="text-gray-400">{d.uploaderName}</span>
                          <span className="mx-1 text-gray-700">•</span>
                          {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}
                        </div>
                        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 text-xs hover:text-blue-300 transition mt-1 inline-block">
                          Lihat File →
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="text" placeholder="Catatan (opsional)..."
                          value={catatanMap[d.id] || ''}
                          onChange={(e) => setCatatanMap(prev => ({ ...prev, [d.id]: e.target.value }))}
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-white text-xs outline-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <button onClick={() => handleQuickApproval(d.id, 'APPROVED')}
                          disabled={approvalLoading === d.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap"
                          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
                          {approvalLoading === d.id ? '...' : '✓ Setujui'}
                        </button>
                        <button onClick={() => handleQuickApproval(d.id, 'REJECTED')}
                          disabled={approvalLoading === d.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 whitespace-nowrap"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                          {approvalLoading === d.id ? '...' : '✗ Tolak'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {[
            { placeholder: 'Cari nama pekerjaan...', value: searchNama, onChange: setSearchNama },
            { placeholder: 'Cari wilayah pengerjaan...', value: searchWilayah, onChange: setSearchWilayah },
          ].map(({ placeholder, value, onChange }) => (
            <div key={placeholder} className="flex items-center flex-1 px-3 py-2 rounded-xl gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <input type="text" placeholder={placeholder} value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-transparent outline-none text-sm text-gray-300 w-full placeholder-gray-600" />
              <span className="text-gray-600 text-xs">🔍</span>
            </div>
          ))}
          {(searchNama || searchWilayah) && (
            <button onClick={() => { setSearchNama(''); setSearchWilayah('') }}
              className="text-xs text-gray-500 hover:text-red-400 transition px-2">Reset</button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['SEMUA', 'PERENCANAAN', 'BERJALAN', 'SELESAI'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{
                background: filterStatus === s ? '#2563eb' : 'rgba(255,255,255,0.04)',
                border: filterStatus === s ? '1px solid #2563eb' : '1px solid rgba(255,255,255,0.07)',
                color: filterStatus === s ? '#fff' : '#9ca3af'
              }}>
              {s === 'SEMUA' ? 'Semua' : statusLabel[s]}
            </button>
          ))}
          <button onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white ml-auto transition"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            + Pekerjaan
          </button>
        </div>

        {/* Tabel Desktop */}
        <div className="hidden md:block rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Update', 'Pekerjaan', 'Nilai', 'Progres'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-600">Belum ada pekerjaan</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b transition hover:bg-white/[0.02]"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="py-4 px-4 text-gray-600 text-xs whitespace-pre-line align-top">
                    {formatDate(p.updatedAt)}
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="text-gray-600 text-xs mb-1">Nama pekerjaan</div>
                    <button onClick={() => router.push(`/proyek/${p.id}`)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition text-left">
                      {p.nama || '-'}
                    </button>
                    <div className="mt-1 text-xs text-gray-600">PJ: <span className="text-gray-400">{p.penanggungjawab || '-'}</span></div>
                    <div className="text-xs text-gray-600">Wilayah: <span className="text-gray-400">{p.wilayah || '-'}</span></div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="text-xs text-gray-600 mb-1">Nilai</div>
                    <div className="text-sm font-medium text-gray-300">{formatRupiah(p.nilai || 0)}</div>
                    <div className="mt-1 text-xs text-gray-600">Jenis: <span className="text-gray-400">{p.jenis || '-'}</span></div>
                  </td>
                  <td className="py-4 px-4 align-top">
                    <div className="text-xs text-gray-600 mb-1">Diinput oleh</div>
                    <div className="text-sm text-gray-300">{p.userName || '-'}</div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === 'BERJALAN' ? 'bg-blue-500/10 text-blue-400' :
                        p.status === 'SELESAI' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>{statusLabel[p.status] || p.status}</span>
                    </div>
                    {(() => {
                      const d = getDiffDays(p.tanggalSelesai)
                      if (d <= 7 && d >= 0 && p.status !== 'SELESAI') return <div className="text-xs text-orange-400 mt-1">⚠ {d} hari lagi</div>
                      if (d < 0 && p.status !== 'SELESAI') return <div className="text-xs text-red-400 mt-1">⚠ Lewat batas</div>
                      return null
                    })()}
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => router.push(`/proyek/${p.id}`)} className="text-blue-400 text-xs hover:text-blue-300 transition">Detail</button>
                      {(session?.user as any)?.role === 'ADMIN' && (
                        <button onClick={() => handleDelete(p.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Mobile */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-gray-600">Belum ada pekerjaan</p>
          ) : filtered.map((p) => (
            <div key={p.id} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-start mb-3">
                <button onClick={() => router.push(`/proyek/${p.id}`)}
                  className="text-blue-400 text-sm font-medium text-left flex-1 mr-2 hover:text-blue-300 transition">
                  {p.nama || '-'}
                </button>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${p.status === 'BERJALAN' ? 'bg-blue-500/10 text-blue-400' :
                  p.status === 'SELESAI' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>{statusLabel[p.status] || p.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div><span className="text-gray-600">Jenis: </span><span className="text-gray-400">{p.jenis || '-'}</span></div>
                <div><span className="text-gray-600">Nilai: </span><span className="text-gray-400">{formatRupiah(p.nilai || 0)}</span></div>
                <div><span className="text-gray-600">PJ: </span><span className="text-gray-400">{p.penanggungjawab || '-'}</span></div>
                <div><span className="text-gray-600">Wilayah: </span><span className="text-gray-400">{p.wilayah || '-'}</span></div>
                <div><span className="text-gray-600">Input: </span><span className="text-gray-400">{p.userName || '-'}</span></div>
                <div><span className="text-gray-600">Update: </span><span className="text-gray-400">{new Date(p.updatedAt).toLocaleDateString('id-ID')}</span></div>
              </div>
              {(() => {
                const d = getDiffDays(p.tanggalSelesai)
                if (d <= 7 && d >= 0 && p.status !== 'SELESAI') return <div className="text-xs text-orange-400 mt-2">⚠ {d} hari lagi</div>
                if (d < 0 && p.status !== 'SELESAI') return <div className="text-xs text-red-400 mt-2">⚠ Lewat batas waktu</div>
                return null
              })()}
              <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => router.push(`/proyek/${p.id}`)} className="text-blue-400 text-xs hover:text-blue-300 transition">Detail</button>
                {(session?.user as any)?.role === 'ADMIN' && (
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Tambah Pekerjaan */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-base font-semibold text-white mb-5">Tambah Pekerjaan</h3>
            <div className="space-y-3">
              {[
                { label: 'Nama Pekerjaan', key: 'nama', type: 'text', required: true },
                { label: 'Jenis Pekerjaan', key: 'jenis', type: 'text', required: true },
                { label: 'Nilai Pekerjaan (Rp)', key: 'nilai', type: 'number', required: false },
                { label: 'Penanggung Jawab', key: 'penanggungjawab', type: 'text', required: false },
                { label: 'Wilayah Pengerjaan', key: 'wilayah', type: 'text', required: false },
                { label: 'Sektor', key: 'sektor', type: 'text', required: true },
                { label: 'Tanggal Mulai', key: 'tanggalMulai', type: 'date', required: true },
                { label: 'Tanggal Selesai', key: 'tanggalSelesai', type: 'date', required: false },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    {label} {required && <span className="text-red-400">*</span>}
                  </label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none transition"
                    style={{
                      background: required && !form[key as keyof typeof form] ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.04)',
                      border: required && !form[key as keyof typeof form] ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      colorScheme: type === 'date' ? 'dark' : undefined
                    } as React.CSSProperties} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}>
                  <option value="PERENCANAAN" className="bg-gray-900">Draft</option>
                  <option value="BERJALAN" className="bg-gray-900">Sedang Diproses</option>
                  <option value="SELESAI" className="bg-gray-900">Selesai</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                Simpan
              </button>
              <button onClick={() => { setShowForm(false); resetForm() }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}