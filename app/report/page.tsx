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
}

interface Dokumen {
  id: string
  jenisDokumen: string
  fileUrl: string
  fileName: string
  tanggalUpload: string
  projectId: string
}

interface Transaksi {
  id: string
  jenisPembayaran: string
  keterangan: string
  jumlah: number
  tanggalPembayaran: string
  buktiBayarUrl?: string
  projectId: string
}

export default function ReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [allDokumen, setAllDokumen] = useState<Dokumen[]>([])
  const [allTransaksi, setAllTransaksi] = useState<Transaksi[]>([])
  const [loading, setLoading] = useState(true)

  const [filterJenis, setFilterJenis] = useState('Semua')
  const [filterWilayah, setFilterWilayah] = useState('Semua')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [filterDokumen, setFilterDokumen] = useState('Semua')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/proyek')
      const data = await res.json()
      const proyekList: Project[] = Array.isArray(data) ? data : []
      setProjects(proyekList)

      const dokumenList: Dokumen[] = []
      const transaksiList: Transaksi[] = []

      await Promise.all(proyekList.map(async (p) => {
        const [dRes, tRes] = await Promise.all([
          fetch(`/api/dokumen?projectId=${p.id}`),
          fetch(`/api/transaksi?projectId=${p.id}`)
        ])
        const dData = await dRes.json()
        const tData = await tRes.json()

        if (Array.isArray(dData)) {
          dokumenList.push(...dData.map((d: Dokumen) => ({ ...d, projectId: p.id })))
        }

        if (Array.isArray(tData)) {
          transaksiList.push(...tData.map((t: Transaksi) => ({ ...t, projectId: p.id })))
        }
      }))

      setAllDokumen(dokumenList)
      setAllTransaksi(transaksiList)

    } catch (error) {
      console.error('Error fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) return <Loading />
  if (status === 'unauthenticated') return null

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num)

  const statusLabel: Record<string, string> = {
    PERENCANAAN: 'Draft', BERJALAN: 'Sedang Diproses', SELESAI: 'Selesai'
  }

  const jenisDokumenLabel: Record<string, string> = {
    PROPOSAL: 'Proposal', KONTRAK_KERJA: 'Kontrak Kerja',
    SURAT_IZIN: 'Surat Izin', DOKUMENTASI_KEGIATAN: 'Dokumentasi Kegiatan',
    LAPORAN_PEKERJAAN: 'Laporan Pekerjaan'
  }

  const uniqueJenis = ['Semua', ...Array.from(new Set(projects.map(p => p.jenis).filter(Boolean)))]
  const uniqueWilayah = ['Semua', ...Array.from(new Set(projects.map(p => p.wilayah).filter(Boolean)))]
  const uniqueStatus = ['Semua', 'PERENCANAAN', 'BERJALAN', 'SELESAI']
  const uniqueDokumen = ['Semua', 'KONTRAK_KERJA', 'PROPOSAL', 'SURAT_IZIN', 'DOKUMENTASI_KEGIATAN', 'LAPORAN_PEKERJAAN']

  const filteredProjects = projects.filter(p => {
    const matchJenis = filterJenis === 'Semua' || p.jenis === filterJenis
    const matchWilayah = filterWilayah === 'Semua' || p.wilayah === filterWilayah
    const matchStatus = filterStatus === 'Semua' || p.status === filterStatus
    return matchJenis && matchWilayah && matchStatus
  })

  const filteredDokumen = allDokumen.filter(d => {
    const matchDokumen = filterDokumen === 'Semua' || d.jenisDokumen === filterDokumen
    const projectMatch = filteredProjects.some(p => p.id === d.projectId)
    return matchDokumen && projectMatch
  })

  if (loading) return <Loading />
  return (
    <div style={{ minHeight: '100dvh', background: '#030712' }}>
      <Header />

      <main className="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto">

        <div className="px-4 py-2.5 rounded-xl font-bold text-sm mb-6 text-white"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
          REPORT
        </div>

        {/* Filter Pekerjaan */}
        <div className="rounded-xl p-5 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-semibold text-gray-400 text-xs uppercase tracking-widest mb-4">Informasi Pekerjaan</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Jenis Pekerjaan', value: filterJenis, onChange: setFilterJenis, options: uniqueJenis },
              { label: 'Wilayah', value: filterWilayah, onChange: setFilterWilayah, options: uniqueWilayah },
              { label: 'Status', value: filterStatus, onChange: setFilterStatus, options: uniqueStatus, labelMap: (s: string) => s === 'Semua' ? 'Semua' : statusLabel[s] },
            ].map(({ label, value, onChange, options, labelMap }) => (
              <div key={label}>
                <label className="block text-xs text-gray-600 mb-1.5">{label}</label>
                <select value={value} onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-gray-300 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {options.map((o: string) => (
                    <option key={o} value={o} className="bg-gray-900">
                      {labelMap ? labelMap(o) : o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Tidak ada proyek yang sesuai filter</p>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map(p => (
                <div key={p.id} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-200 text-sm mb-2">{p.nama}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                        <div><span className="text-gray-600">Jenis: </span><span className="text-gray-400">{p.jenis}</span></div>
                        <div><span className="text-gray-600">Wilayah: </span><span className="text-gray-400">{p.wilayah}</span></div>
                        <div><span className="text-gray-600">Sektor: </span><span className="text-gray-400">{p.sektor}</span></div>
                        <div><span className="text-gray-600">Nilai: </span><span className="text-gray-400">{formatRupiah(p.nilai)}</span></div>
                        <div><span className="text-gray-600">PJ: </span><span className="text-gray-400">{p.penanggungjawab}</span></div>
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'BERJALAN' ? 'bg-blue-500/10 text-blue-400' :
                              p.status === 'SELESAI' ? 'bg-emerald-500/10 text-emerald-400' :
                                'bg-gray-500/10 text-gray-500'
                            }`}>{statusLabel[p.status]}</span>
                        </div>
                        <div><span className="text-gray-600">Mulai: </span><span className="text-gray-400">{p.tanggalMulai ? new Date(p.tanggalMulai).toLocaleDateString('id-ID') : '-'}</span></div>
                        <div><span className="text-gray-600">Selesai: </span><span className="text-gray-400">{p.tanggalSelesai ? new Date(p.tanggalSelesai).toLocaleDateString('id-ID') : '-'}</span></div>
                      </div>
                      {allTransaksi.filter(t => t.projectId === p.id).length > 0 && (
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-xs text-gray-600">Total keuangan: </span>
                          <span className="text-xs text-emerald-400 font-medium">
                            {formatRupiah(allTransaksi.filter(t => t.projectId === p.id).reduce((acc, t) => acc + t.jumlah, 0))}
                          </span>
                          <span className="text-xs text-gray-700 ml-2">
                            ({allTransaksi.filter(t => t.projectId === p.id).length} transaksi)
                          </span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => router.push(`/proyek/${p.id}`)}
                      className="text-blue-400 text-xs hover:text-blue-300 transition ml-4 whitespace-nowrap">
                      Detail →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Dokumen */}
        <div className="rounded-xl p-5 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="font-semibold text-gray-400 text-xs uppercase tracking-widest mb-4">File Dokumen</div>
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1.5">Jenis Dokumen</label>
            <select value={filterDokumen} onChange={(e) => setFilterDokumen(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 rounded-lg text-sm text-gray-300 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {uniqueDokumen.map(d => (
                <option key={d} value={d} className="bg-gray-900">{d === 'Semua' ? 'Semua' : jenisDokumenLabel[d]}</option>
              ))}
            </select>
          </div>
          {filteredDokumen.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-4">Tidak ada dokumen</p>
          ) : (
            <div className="space-y-2">
              {filteredDokumen.map(d => {
                const proyek = projects.find(p => p.id === d.projectId)
                return (
                  <div key={d.id} className="flex items-center justify-between rounded-lg px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="text-sm text-gray-300">{d.fileName}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {jenisDokumenLabel[d.jenisDokumen]} • {proyek?.nama} • {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 text-xs hover:text-blue-300 transition ml-4 whitespace-nowrap">
                      Download
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Proyek', value: filteredProjects.length, color: '#f9fafb' },
            { label: 'Total Dokumen', value: filteredDokumen.length, color: '#60a5fa' },
            { label: 'Total Nilai', value: formatRupiah(filteredProjects.reduce((acc, p) => acc + p.nilai, 0)), color: '#34d399', small: true },
          ].map(({ label, value, color, small }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs text-gray-600">{label}</div>
              <div className={`font-bold mt-1 ${small ? 'text-lg' : 'text-2xl'}`} style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}