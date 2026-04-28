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
    LAPORAN_AKHIR: 'Laporan Akhir', SURAT_REKOMENDASI: 'Surat Rekomendasi',
    LAPORAN_PERIODIK: 'Laporan Periodik', LAIN_LAIN: 'Lain-lain'
  }

  const uniqueJenis = ['Semua', ...Array.from(new Set(projects.map(p => p.jenis).filter(Boolean)))]
  const uniqueWilayah = ['Semua', ...Array.from(new Set(projects.map(p => p.wilayah).filter(Boolean)))]
  const uniqueStatus = ['Semua', 'PERENCANAAN', 'BERJALAN', 'SELESAI']
  const uniqueDokumen = ['Semua', 'KONTRAK_KERJA', 'PROPOSAL', 'SURAT_IZIN', 'DOKUMENTASI_KEGIATAN', 'LAPORAN_AKHIR', 'SURAT_REKOMENDASI', 'LAPORAN_PERIODIK', 'LAIN_LAIN']

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
    <div style={{ minHeight: '100dvh', background: '#f5f7ff' }}>
      <Header />

      <main className="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="px-4 py-2.5 rounded-xl font-semibold text-sm mb-6 text-white"
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
          }}>
          REPORT
        </div>

        {/* Filter Pekerjaan */}
        <div className="rounded-xl p-5 mb-6 bg-white border border-gray-200 shadow-sm">
          <div className="font-semibold text-gray-700 text-xs uppercase tracking-widest mb-4">
            Informasi Pekerjaan
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Jenis Pekerjaan', value: filterJenis, onChange: setFilterJenis, options: uniqueJenis },
              { label: 'Wilayah', value: filterWilayah, onChange: setFilterWilayah, options: uniqueWilayah },
              { label: 'Status', value: filterStatus, onChange: setFilterStatus, options: uniqueStatus, labelMap: (s: string) => s === 'Semua' ? 'Semua' : statusLabel[s] },
            ].map(({ label, value, onChange, options, labelMap }) => (
              <div key={label}>
                <label className="block text-xs text-gray-600 mb-1.5">{label}</label>
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-gray-700 bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {options.map((o: string) => (
                    <option key={o} value={o}>
                      {labelMap ? labelMap(o) : o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* List Project */}
          {filteredProjects.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Tidak ada proyek</p>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map(p => (
                <div key={p.id}
                  className="rounded-xl p-4 bg-gray-50 border border-gray-200 hover:shadow-sm transition">

                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm mb-2">{p.nama}</div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                        <div><span className="text-gray-500">Program: </span><span className="text-gray-700">{p.jenis}</span></div>
                        <div><span className="text-gray-500">Wilayah: </span><span className="text-gray-700">{p.wilayah}</span></div>
                        <div><span className="text-gray-500">Sektor: </span><span className="text-gray-700">{p.sektor}</span></div>
                        <div><span className="text-gray-500">Nilai: </span><span className="text-gray-700">{formatRupiah(p.nilai)}</span></div>
                        <div><span className="text-gray-500">PM: </span><span className="text-gray-700">{p.penanggungjawab}</span></div>

                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full
                          ${p.status === 'BERJALAN'
                              ? 'bg-blue-100 text-blue-600'
                              : p.status === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                            {statusLabel[p.status]}
                          </span>
                        </div>
                      </div>

                      {allTransaksi.filter(t => t.projectId === p.id).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">Total keuangan: </span>
                          <span className="text-xs text-emerald-600 font-medium">
                            {formatRupiah(allTransaksi
                              .filter(t => t.projectId === p.id)
                              .reduce((acc, t) => acc + t.jumlah, 0))}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/proyek/${p.id}`)}
                      className="text-blue-600 text-xs hover:text-blue-700 ml-4">
                      Detail →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Proyek', value: filteredProjects.length },
            { label: 'Total Dokumen', value: filteredDokumen.length },
            { label: 'Total Nilai', value: formatRupiah(filteredProjects.reduce((acc, p) => acc + p.nilai, 0)), small: true },
          ].map(({ label, value, small }) => (
            <div key={label}
              className="rounded-xl p-4 bg-white border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500">{label}</div>
              <div className={`font-bold mt-1 text-blue-600 ${small ? 'text-lg' : 'text-2xl'}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}