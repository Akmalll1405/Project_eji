'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('SEMUA')
  const [searchNama, setSearchNama] = useState('')
  const [searchWilayah, setSearchWilayah] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nama: '', jenis: '', nilai: '', penanggungjawab: '',
    wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProjects()
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

  if (status === 'loading' || loading) return <Loading />
  if (status === 'unauthenticated') return null

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

  const resetForm = () => {
    setForm({
      nama: '', jenis: '', nilai: '', penanggungjawab: '',
      wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN'
    })
  }

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID').format(num)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      '\n' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const statusLabel: Record<string, string> = {
    PERENCANAAN: 'Draft',
    BERJALAN: 'Sedang Diproses',
    SELESAI: 'Selesai'
  }

  const filtered = projects.filter(p => {
    const matchStatus = filterStatus === 'SEMUA' || p.status === filterStatus
    const matchNama = (p.nama || '').toLowerCase().includes(searchNama.toLowerCase())
    const matchWilayah = (p.wilayah || '').toLowerCase().includes(searchWilayah.toLowerCase())
    return matchStatus && matchNama && matchWilayah
  })

  const totalProyek = projects.length
  const sedangBerjalan = projects.filter(p => p.status === 'BERJALAN').length
  const selesai = projects.filter(p => p.status === 'SELESAI').length

  const getDiffDays = (tanggalSelesai: string) => {
    const selesaiDate = new Date(tanggalSelesai)
    const today = new Date()
    return Math.ceil((selesaiDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }


return (
  <div style={{ minHeight: '100dvh', background: '#030712' }}>
    <Header />

    <main className="px-4 sm:px-6 py-4 sm:py-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Proyek', value: totalProyek, color: '#f9fafb' },
          { label: 'Sedang Berjalan', value: sedangBerjalan, color: '#60a5fa' },
          { label: 'Selesai', value: selesai, color: '#34d399' },
          { label: 'Hampir Selesai', value: projects.filter(p => { const d = getDiffDays(p.tanggalSelesai); return d <= 7 && d >= 0 && p.status !== 'SELESAI' }).length, color: '#fb923c' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

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
                  <div className="mt-2 text-xs text-gray-600">PJ: <span className="text-gray-400">{p.penanggungjawab || '-'}</span></div>
                  <div className="text-xs text-gray-600">Wilayah: <span className="text-gray-400">{p.wilayah || '-'}</span></div>
                </td>
                <td className="py-4 px-4 align-top">
                  <div className="text-xs text-gray-600 mb-1">Nilai</div>
                  <div className="text-sm font-medium text-gray-300">{formatRupiah(p.nilai || 0)}</div>
                  <div className="mt-2 text-xs text-gray-600">Jenis: <span className="text-gray-400">{p.jenis || '-'}</span></div>
                </td>
                <td className="py-4 px-4 align-top">
                  <div className="text-xs text-gray-600 mb-1">Diinput oleh</div>
                  <div className="text-sm text-gray-300">{p.userName || '-'}</div>
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'BERJALAN' ? 'bg-blue-500/10 text-blue-400' :
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
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                p.status === 'BERJALAN' ? 'bg-blue-500/10 text-blue-400' :
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

    {/* Modal */}
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
                  }} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
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