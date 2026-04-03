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
    <div className="min-h-screen-[100svh] bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <Header />

      <main className="px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full">

        {/* ===== SECTION REPORT ===== */}
        <div className="bg-blue-500 text-white px-4 py-2 font-bold text-sm mb-6">REPORT</div>

        {/* ===== FILTER INFORMASI PEKERJAAN ===== */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="font-bold text-gray-700 text-sm mb-3">INFORMASI PEKERJAAN</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jenis Pekerjaan <span className="text-red-500">*</span></label>
              <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                {uniqueJenis.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Wilayah Pekerjaan <span className="text-red-500">*</span></label>
              <select value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                {uniqueWilayah.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                {uniqueStatus.map(s => (
                  <option key={s} value={s}>{s === 'Semua' ? 'Semua' : statusLabel[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hasil filter proyek */}
          {filteredProjects.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Tidak ada proyek yang sesuai filter</p>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map(p => (
                <div key={p.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-sm">{p.nama}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                        <div>Jenis: <span className="font-bold text-gray-700">{p.jenis}</span></div>
                        <div>Wilayah: <span className="font-bold text-gray-700">{p.wilayah}</span></div>
                        <div>Sektor: <span className="font-bold text-gray-700">{p.sektor}</span></div>
                        <div>Nilai: <span className="font-bold text-gray-700">{formatRupiah(p.nilai)}</span></div>
                        <div>PJ: <span className="font-bold text-gray-700">{p.penanggungjawab}</span></div>
                        <div>
                          Status:
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-bold ${p.status === 'BERJALAN' ? 'bg-blue-100 text-blue-700' :
                            p.status === 'SELESAI' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {statusLabel[p.status]}
                          </span>
                        </div>
                        <div>Mulai: <span className="font-bold text-gray-700">{new Date(p.tanggalMulai).toLocaleDateString('id-ID')}</span></div>
                        <div>Selesai: <span className="font-bold text-gray-700">{new Date(p.tanggalSelesai).toLocaleDateString('id-ID')}</span></div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/proyek/${p.id}`)}
                      className="text-blue-500 text-xs underline ml-2 whitespace-nowrap shrink-0"
                    >
                      Lihat Detail
                    </button>
                  </div>

                  {/* Transaksi proyek ini */}
                  {allTransaksi.filter(t => t.projectId === p.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-bold text-gray-500 mb-2">KEUANGAN</div>
                      <div className="text-xs text-gray-600">
                        Total: <span className="font-bold text-green-600">
                          {formatRupiah(allTransaksi.filter(t => t.projectId === p.id).reduce((acc, t) => acc + t.jumlah, 0))}
                        </span>
                        <span className="ml-3 text-gray-400">
                          ({allTransaksi.filter(t => t.projectId === p.id).length} transaksi)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== FILTER FILE DOKUMEN ===== */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="font-bold text-gray-700 text-sm mb-3">FILE DOKUMEN</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama Dokumen <span className="text-red-500">*</span></label>
              <select value={filterDokumen} onChange={(e) => setFilterDokumen(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                {uniqueDokumen.map(d => (
                  <option key={d} value={d}>{d === 'Semua' ? 'Semua' : jenisDokumenLabel[d]}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredDokumen.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Tidak ada dokumen yang sesuai filter</p>
          ) : (
            <div className="space-y-2">
              {filteredDokumen.map(d => {
                const proyek = projects.find(p => p.id === d.projectId)
                return (
                  <div key={d.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{d.fileName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {jenisDokumenLabel[d.jenisDokumen]} •
                        {proyek ? ` ${proyek.nama} • ` : ' '}
                        {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 text-xs underline font-medium whitespace-nowrap ml-4">
                      Download File
                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ===== RINGKASAN ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Total Proyek Terfilter</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{filteredProjects.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Total Dokumen</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{filteredDokumen.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Total Nilai Proyek</div>
            <div className="text-lg font-bold text-green-600 mt-1">
              {formatRupiah(filteredProjects.reduce((acc, p) => acc + p.nilai, 0))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}