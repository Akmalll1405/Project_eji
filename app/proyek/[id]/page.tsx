'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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

interface Donor {
  id: string
  nama: string
  jenis: string
  nilai: number
  penanggungjawab: string
  wilayah: string
  alamat: string
  tahunPendirian: number
  lamaUsaha: number
}

interface Dokumen {
  id: string
  jenisDokumen: string
  fileUrl: string
  fileName: string
  tanggalUpload: string
}

interface Transaksi {
  id: string
  jenisPembayaran: string
  keterangan: string
  nomorRekening?: string
  bankTujuan?: string
  jumlah: number
  tanggalPembayaran: string
  buktiBayarUrl?: string
}

interface Kegiatan {
  id: string
  namaKegiatan: string
  tanggalKegiatan: string
  fotoUrl?: string
  fotoName?: string
}

export default function DetailProyekPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const buktiBayarRef = useRef<HTMLInputElement>(null)
  const fotoKegiatanRef = useRef<HTMLInputElement>(null)

  const [proyek, setProyek] = useState<Project | null>(null)
  const [donors, setDonors] = useState<Donor[]>([])
  const [dokumen, setDokumen] = useState<Dokumen[]>([])
  const [transaksi, setTransaksi] = useState<Transaksi[]>([])
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('proyek')
  const [uploading, setUploading] = useState(false)
  const [uploadingBukti, setUploadingBukti] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const [showDonorForm, setShowDonorForm] = useState(false)
  const [showTransaksiForm, setShowTransaksiForm] = useState(false)
  const [showKegiatanForm, setShowKegiatanForm] = useState(false)
  const [editDonor, setEditDonor] = useState<Donor | null>(null)
  const [editTransaksi, setEditTransaksi] = useState<Transaksi | null>(null)
  const [editKegiatan, setEditKegiatan] = useState<Kegiatan | null>(null)
  const [selectedJenisDokumen, setSelectedJenisDokumen] = useState('KONTRAK_KERJA')

  const [donorForm, setDonorForm] = useState({
    nama: '', jenis: '', nilai: '', penanggungjawab: '',
    wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: ''
  })
  const [transaksiForm, setTransaksiForm] = useState({
    jenisPembayaran: 'TUNAI', keterangan: '',
    nomorRekening: '', bankTujuan: '', jumlah: '',
    tanggalPembayaran: '', buktiBayarUrl: ''
  })
  const [kegiatanForm, setKegiatanForm] = useState({
    namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: ''
  })
  const [editProyekForm, setEditProyekForm] = useState({
    nama: '', jenis: '', nilai: '', penanggungjawab: '',
    wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchAll()
    }
  }, [status])

  const fetchAll = async () => {
    const res = await fetch(`/api/proyek/${id}`)
    const data = await res.json()
    const p = Array.isArray(data) ? data[0] : data
    setProyek(p)
    setEditProyekForm({
      nama: p.nama || '', jenis: p.jenis || '',
      nilai: p.nilai?.toString() || '',
      penanggungjawab: p.penanggungjawab || '',
      wilayah: p.wilayah || '', sektor: p.sektor || '',
      tanggalMulai: p.tanggalMulai?.split('T')[0] || '',
      tanggalSelesai: p.tanggalSelesai?.split('T')[0] || '',
      status: p.status || 'PERENCANAAN'
    })
    await fetchAll2()
    setLoading(false)
  }

  const fetchAll2 = async () => {
    const [donorRes, dokumenRes, transaksiRes, kegiatanRes] = await Promise.all([
      fetch(`/api/donor?projectId=${id}`),
      fetch(`/api/dokumen?projectId=${id}`),
      fetch(`/api/transaksi?projectId=${id}`),
      fetch(`/api/kegiatan?projectId=${id}`)
    ])
    const donorData = await donorRes.json()
    const dokumenData = await dokumenRes.json()
    const transaksiData = await transaksiRes.json()
    const kegiatanData = await kegiatanRes.json()
    setDonors(Array.isArray(donorData) ? donorData : [])
    setDokumen(Array.isArray(dokumenData) ? dokumenData : [])
    setTransaksi(Array.isArray(transaksiData) ? transaksiData : [])
    setKegiatan(Array.isArray(kegiatanData) ? kegiatanData : [])
  }

  const handleUpdateProyek = async () => {
    if (!editProyekForm.nama.trim()) {
      alert('Nama Pekerjaan wajib diisi!')
      return
    }
    if (!editProyekForm.jenis.trim()) {
      alert('Jenis Pekerjaan wajib diisi!')
      return
    }
    if (!editProyekForm.sektor.trim()) {
      alert('Sektor wajib diisi!')
      return
    }
    if (!editProyekForm.tanggalMulai) {
      alert('Tanggal Mulai wajib diisi!')
      return
    }
    if (editProyekForm.tanggalSelesai &&
      new Date(editProyekForm.tanggalSelesai) < new Date(editProyekForm.tanggalMulai)) {
      alert('Tanggal Selesai tidak boleh sebelum Tanggal Mulai!')
      return
    }

    await fetch(`/api/proyek/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editProyekForm)
    })
    alert('Data proyek berhasil diupdate!')
  }

  const handleSaveDonor = async () => {
    if (editDonor) {
      await fetch(`/api/donor/${editDonor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donorForm)
      })
    } else {
      await fetch('/api/donor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...donorForm, projectId: id })
      })
    }
    setShowDonorForm(false)
    setEditDonor(null)
    setDonorForm({ nama: '', jenis: '', nilai: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' })
    fetchAll2()
  }

  const handleDeleteDonor = async (donorId: string) => {
    if (!confirm('Yakin hapus donor ini?')) return
    await fetch(`/api/donor/${donorId}`, { method: 'DELETE' })
    fetchAll2()
  }

  const handleUploadDokumen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) { alert('Format file harus PDF, JPG, atau PNG!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', id)
      formData.append('bucket', 'dokumen')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)
      await fetch('/api/dokumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jenisDokumen: selectedJenisDokumen, fileUrl: uploadData.fileUrl, fileName: uploadData.fileName, projectId: id })
      })
      fetchAll2()
      alert('Dokumen berhasil diupload!')
    } catch (error) {
      alert('Gagal upload dokumen: ' + String(error))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUploadBuktiBayar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) { alert('Format file harus JPG, PNG, atau PDF!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }
    setUploadingBukti(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', id)
      formData.append('bucket', 'bukti-bayar')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)
      setTransaksiForm(prev => ({ ...prev, buktiBayarUrl: uploadData.fileUrl }))
      alert('Bukti bayar berhasil diupload!')
    } catch (error) {
      alert('Gagal upload bukti bayar: ' + String(error))
    } finally {
      setUploadingBukti(false)
      if (buktiBayarRef.current) buktiBayarRef.current.value = ''
    }
  }

  const handleUploadFotoKegiatan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) { alert('Format file harus JPG atau PNG!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }
    setUploadingFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', id)
      formData.append('bucket', 'kegiatan')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)
      setKegiatanForm(prev => ({ ...prev, fotoUrl: uploadData.fileUrl, fotoName: uploadData.fileName }))
      alert('Foto berhasil diupload!')
    } catch (error) {
      alert('Gagal upload foto: ' + String(error))
    } finally {
      setUploadingFoto(false)
      if (fotoKegiatanRef.current) fotoKegiatanRef.current.value = ''
    }
  }

  const handleDeleteDokumen = async (dokumenId: string, fileUrl: string) => {
    if (!confirm('Yakin hapus dokumen ini?')) return
    const fileName = fileUrl.split('/dokumen/')[1]
    if (fileName) await supabase.storage.from('dokumen').remove([fileName])
    await fetch(`/api/dokumen/${dokumenId}`, { method: 'DELETE' })
    fetchAll2()
  }

  const resetTransaksiForm = () => {
    setTransaksiForm({ jenisPembayaran: 'TUNAI', keterangan: '', nomorRekening: '', bankTujuan: '', jumlah: '', tanggalPembayaran: '', buktiBayarUrl: '' })
    if (buktiBayarRef.current) buktiBayarRef.current.value = ''
  }

  const handleSaveTransaksi = async () => {
    if (editTransaksi) {
      await fetch(`/api/transaksi/${editTransaksi.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transaksiForm) })
    } else {
      await fetch('/api/transaksi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...transaksiForm, projectId: id }) })
    }
    setShowTransaksiForm(false)
    setEditTransaksi(null)
    resetTransaksiForm()
    fetchAll2()
  }

  const handleDeleteTransaksi = async (tId: string) => {
    if (!confirm('Yakin hapus transaksi ini?')) return
    await fetch(`/api/transaksi/${tId}`, { method: 'DELETE' })
    fetchAll2()
  }

  const handleSaveKegiatan = async () => {
    if (!kegiatanForm.namaKegiatan || !kegiatanForm.tanggalKegiatan) {
      alert('Nama kegiatan dan tanggal wajib diisi!')
      return
    }
    if (editKegiatan) {
      await fetch(`/api/kegiatan/${editKegiatan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kegiatanForm) })
    } else {
      await fetch('/api/kegiatan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...kegiatanForm, projectId: id }) })
    }
    setShowKegiatanForm(false)
    setEditKegiatan(null)
    setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' })
    fetchAll2()
  }

  const handleDeleteKegiatan = async (kegiatanId: string) => {
    if (!confirm('Yakin hapus kegiatan ini?')) return
    await fetch(`/api/kegiatan/${kegiatanId}`, { method: 'DELETE' })
    fetchAll2()
  }

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num)

  const jenisDokumenLabel: Record<string, string> = {
    PROPOSAL: 'Proposal', KONTRAK_KERJA: 'Kontrak Kerja', SURAT_IZIN: 'Surat Izin',
    DOKUMENTASI_KEGIATAN: 'Dokumentasi Kegiatan', LAPORAN_PEKERJAAN: 'Laporan Pekerjaan'
  }

  const statusLabel: Record<string, string> = {
    PERENCANAAN: 'Draft', BERJALAN: 'Sedang Diproses', SELESAI: 'Selesai'
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      <main className="px-6 py-6 max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-blue-500 text-sm mb-4 hover:underline">
          ← Kembali ke Dashboard
        </button>

        {/* Info singkat proyek */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="font-bold text-gray-800 text-lg">{proyek?.nama}</div>
          <div className="text-sm text-gray-500 mt-1">
            {proyek?.jenis} • {proyek?.wilayah} •
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${proyek?.status === 'BERJALAN' ? 'bg-blue-100 text-blue-700' :
              proyek?.status === 'SELESAI' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
              {statusLabel[proyek?.status || '']}
            </span>
          </div>
        </div>

        {/* Nav Tab */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'proyek', label: 'Data Proyek' },
            { key: 'donor', label: 'Data Pendonor' },
            { key: 'dokumen', label: 'Upload Dokumen' },
            { key: 'keuangan', label: 'Keuangan' },
            { key: 'lainlain', label: 'Lain-Lain' },
          ].map((s) => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeSection === s.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ===== DATA PROYEK ===== */}
        {activeSection === 'proyek' && (
          <div>
            <div className="bg-blue-500 text-white px-4 py-2 font-bold text-sm mb-4">DATA PROJEK</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Jenis Proyek', key: 'jenis' },
                { label: 'Nama Pekerjaan', key: 'nama' },
                { label: 'Nilai Pekerjaan (Rp)', key: 'nilai' },
                { label: 'Penanggung Jawab', key: 'penanggungjawab' },
                { label: 'Wilayah Pengerjaan', key: 'wilayah' },
                { label: 'Sektor', key: 'sektor' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label} <span className="text-red-500">*</span></label>
                  <input type={key === 'nilai' ? 'number' : 'text'}
                    value={editProyekForm[key as keyof typeof editProyekForm]}
                    onChange={(e) => setEditProyekForm({ ...editProyekForm, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
                <input type="date" value={editProyekForm.tanggalMulai}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, tanggalMulai: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tanggal Selesai</label>
                <input type="date" value={editProyekForm.tanggalSelesai}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, tanggalSelesai: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status <span className="text-red-500">*</span></label>
                <select value={editProyekForm.status}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                  <option value="PERENCANAAN">Draft</option>
                  <option value="BERJALAN">Sedang Diproses</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </div>
            </div>
            <button onClick={handleUpdateProyek}
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium">
              Simpan Perubahan
            </button>
          </div>
        )}

        {/* ===== DATA PENDONOR ===== */}
        {activeSection === 'donor' && (
          <div>
            <div className="bg-blue-500 text-white px-4 py-2 font-bold text-sm mb-4 flex justify-between items-center">
              <span>DATA PENDONOR</span>
              <button onClick={() => { setShowDonorForm(true); setEditDonor(null); setDonorForm({ nama: '', jenis: '', nilai: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' }) }}
                className="bg-white text-blue-500 px-3 py-1 rounded text-xs font-bold">+ Tambah Donor</button>
            </div>
            {donors.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada data pendonor</p>
            ) : donors.map((d) => (
              <div key={d.id} className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
                <div className="bg-teal-500 text-white px-4 py-2 font-bold text-sm">{d.nama}</div>
                <div className="p-4">
                  <div className="text-sm font-bold text-gray-700 mb-2">{d.alamat}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Tahun Pendirian: <span className="font-bold">{d.tahunPendirian}</span></div>
                    <div>Lama Usaha: <span className="font-bold">{d.lamaUsaha} tahun</span></div>
                  </div>
                  <div className="mt-2 text-xs">
                    <div className="font-bold text-gray-500 mt-2">PENGURUS</div>
                    <div className="text-gray-600">Penanggung Jawab:</div>
                    <div className="font-bold text-gray-800">{d.penanggungjawab}</div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => {
                      setEditDonor(d)
                      setDonorForm({ nama: d.nama, jenis: d.jenis, nilai: d.nilai.toString(), penanggungjawab: d.penanggungjawab, wilayah: d.wilayah, alamat: d.alamat, tahunPendirian: d.tahunPendirian?.toString(), lamaUsaha: d.lamaUsaha?.toString() })
                      setShowDonorForm(true)
                    }} className="text-blue-500 text-xs underline">Edit</button>
                    <button onClick={() => handleDeleteDonor(d.id)} className="text-red-500 text-xs underline">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== UPLOAD DOKUMEN ===== */}
        {activeSection === 'dokumen' && (
          <div>
            <div className="bg-blue-500 text-white px-4 py-2 font-bold text-sm mb-4">UPLOAD DOKUMEN PEKERJAAN</div>
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Jenis Dokumen</label>
                  <select value={selectedJenisDokumen} onChange={(e) => setSelectedJenisDokumen(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                    <option value="KONTRAK_KERJA">Kontrak Kerja</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="SURAT_IZIN">Surat Izin</option>
                    <option value="DOKUMENTASI_KEGIATAN">Dokumentasi Kegiatan</option>
                    <option value="LAPORAN_PEKERJAAN">Laporan Pekerjaan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">File Dokumen</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleUploadDokumen} className="hidden" id="fileUpload" />
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <div className="text-gray-400 text-2xl mb-1">📎</div>
                      <div className="text-xs text-gray-500">{uploading ? 'Mengupload...' : 'Klik untuk upload file'}</div>
                      <div className="text-xs text-gray-400 mt-1">Format: PDF, JPG, PNG (maks 10MB)</div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {dokumen.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada dokumen yang diupload</p>
            ) : (
              <div className="space-y-3">
                {dokumen.map((d) => (
                  <div key={d.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{d.fileName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {jenisDokumenLabel[d.jenisDokumen]} • {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs underline">Download</a>
                      <button onClick={() => handleDeleteDokumen(d.id, d.fileUrl)} className="text-red-500 text-xs underline">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== KEUANGAN ===== */}
        {activeSection === 'keuangan' && (
          <div>
            <div className="bg-blue-500 text-white px-4 py-2 font-bold text-sm mb-4 flex justify-between items-center">
              <span>TRANSPARANSI KEUANGAN (Pembayaran)</span>
              <button onClick={() => { setShowTransaksiForm(true); setEditTransaksi(null); resetTransaksiForm() }}
                className="bg-white text-blue-500 px-3 py-1 rounded text-xs font-bold">+ Pembayaran</button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-500">Total Pembayaran</div>
              <div className="text-2xl font-bold text-green-600">
                {formatRupiah(transaksi.reduce((acc, t) => acc + t.jumlah, 0))}
              </div>
            </div>
            {transaksi.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada transaksi</p>
            ) : transaksi.map((t) => (
              <div key={t.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs flex-1">
                    <div><div className="text-gray-500">Jenis Pembayaran</div><div className="font-bold text-gray-700">{t.jenisPembayaran}</div></div>
                    <div><div className="text-gray-500">Keterangan</div><div className="font-bold text-gray-700">{t.keterangan}</div></div>
                    {t.bankTujuan && <div><div className="text-gray-500">Bank Tujuan</div><div className="font-bold text-gray-700">{t.bankTujuan}</div></div>}
                    {t.nomorRekening && <div><div className="text-gray-500">No. Rekening</div><div className="font-bold text-gray-700">{t.nomorRekening}</div></div>}
                    <div><div className="text-gray-500">Tanggal</div><div className="font-bold text-gray-700">{new Date(t.tanggalPembayaran).toLocaleDateString('id-ID')}</div></div>
                    <div><div className="text-gray-500">Jumlah</div><div className="font-bold text-green-600">{formatRupiah(t.jumlah)}</div></div>
                    {t.buktiBayarUrl && (
                      <div className="col-span-2">
                        <div className="text-gray-500">Bukti Pembayaran</div>
                        <a href={t.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs underline">Lihat Bukti</a>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => {
                      setEditTransaksi(t)
                      setTransaksiForm({ jenisPembayaran: t.jenisPembayaran, keterangan: t.keterangan, nomorRekening: t.nomorRekening || '', bankTujuan: t.bankTujuan || '', jumlah: t.jumlah.toString(), tanggalPembayaran: t.tanggalPembayaran.split('T')[0], buktiBayarUrl: t.buktiBayarUrl || '' })
                      setShowTransaksiForm(true)
                    }} className="text-blue-500 text-xs underline">Edit</button>
                    <button onClick={() => handleDeleteTransaksi(t.id)} className="text-red-500 text-xs underline">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== LAIN-LAIN ===== */}
        {activeSection === 'lainlain' && (
          <div>
            <div className="bg-blue-500 text-white px-4 py-2 font-bold text-sm mb-4 flex justify-between items-center">
              <span>LAIN-LAIN</span>
              <button onClick={() => { setShowKegiatanForm(true); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }}
                className="bg-white text-blue-500 px-3 py-1 rounded text-xs font-bold">+ Kegiatan</button>
            </div>
            {kegiatan.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Belum ada kegiatan</p>
            ) : (
              <div className="space-y-3">
                {kegiatan.map((k) => (
                  <div key={k.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-sm">{k.namaKegiatan}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(k.tanggalKegiatan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                        {k.fotoUrl && (
                          <div className="mt-3">
                            <img src={k.fotoUrl} alt={k.namaKegiatan} className="w-48 h-32 object-cover rounded-lg border border-gray-200" />
                            <a href={k.fotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs underline mt-1 block">Lihat foto lengkap</a>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => {
                          setEditKegiatan(k)
                          setKegiatanForm({ namaKegiatan: k.namaKegiatan, tanggalKegiatan: k.tanggalKegiatan.split('T')[0], fotoUrl: k.fotoUrl || '', fotoName: k.fotoName || '' })
                          setShowKegiatanForm(true)
                        }} className="text-blue-500 text-xs underline">Edit</button>
                        <button onClick={() => handleDeleteKegiatan(k.id)} className="text-red-500 text-xs underline">Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Donor */}
      {showDonorForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">{editDonor ? 'Edit Donor' : 'Tambah Donor'}</h3>
            <div className="space-y-3">
              {[
                { label: 'Nama Yayasan/Lembaga', key: 'nama' },
                { label: 'Alamat Lengkap', key: 'alamat' },
                { label: 'Tahun Pendirian', key: 'tahunPendirian' },
                { label: 'Lama Usaha (tahun)', key: 'lamaUsaha' },
                { label: 'Penanggung Jawab', key: 'penanggungjawab' },
                { label: 'Nilai Donasi (Rp)', key: 'nilai' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-300 mb-1">{label}</label>
                  <input type={['nilai', 'tahunPendirian', 'lamaUsaha'].includes(key) ? 'number' : 'text'}
                    value={donorForm[key as keyof typeof donorForm]}
                    onChange={(e) => setDonorForm({ ...donorForm, [key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveDonor} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg font-medium">Simpan</button>
              <button onClick={() => { setShowDonorForm(false); setEditDonor(null) }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transaksi */}
      {showTransaksiForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">{editTransaksi ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Jenis Pembayaran</label>
                <select value={transaksiForm.jenisPembayaran}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, jenisPembayaran: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="TUNAI">Tunai</option>
                  <option value="NONTUNAI">Non-Tunai</option>
                </select>
              </div>
              {[
                { label: 'Keterangan Pembayaran', key: 'keterangan' },
                { label: 'Nomor Rekening', key: 'nomorRekening' },
                { label: 'Bank Tujuan', key: 'bankTujuan' },
                { label: 'Jumlah (Rp)', key: 'jumlah' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-300 mb-1">{label}</label>
                  <input type={key === 'jumlah' ? 'number' : 'text'}
                    value={transaksiForm[key as keyof typeof transaksiForm]}
                    onChange={(e) => setTransaksiForm({ ...transaksiForm, [key]: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-300 mb-1">Tanggal Pembayaran</label>
                <input type="date" value={transaksiForm.tanggalPembayaran}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, tanggalPembayaran: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Bukti Pembayaran</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center">
                  <input ref={buktiBayarRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleUploadBuktiBayar} className="hidden" id="buktiBayarUpload" />
                  <label htmlFor="buktiBayarUpload" className="cursor-pointer">
                    <div className="text-gray-400 text-xl mb-1">📎</div>
                    <div className="text-xs text-gray-400">{uploadingBukti ? 'Mengupload...' : 'Klik untuk upload bukti bayar'}</div>
                    <div className="text-xs text-gray-500 mt-1">Format: JPG, PNG, PDF</div>
                  </label>
                </div>
                {transaksiForm.buktiBayarUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-green-400 text-xs">✓ Bukti sudah diupload</span>
                    <a href={transaksiForm.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs underline">Lihat file</a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveTransaksi} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg font-medium">Simpan</button>
              <button onClick={() => { setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm() }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kegiatan */}
      {showKegiatanForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">{editKegiatan ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Nama Kegiatan <span className="text-red-400">*</span></label>
                <input type="text" value={kegiatanForm.namaKegiatan}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, namaKegiatan: e.target.value })}
                  placeholder="Masukkan nama kegiatan"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Tanggal Kegiatan <span className="text-red-400">*</span></label>
                <input type="date" value={kegiatanForm.tanggalKegiatan}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, tanggalKegiatan: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Foto Dokumentasi</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center">
                  <input ref={fotoKegiatanRef} type="file" accept=".jpg,.jpeg,.png"
                    onChange={handleUploadFotoKegiatan} className="hidden" id="fotoKegiatanUpload" />
                  <label htmlFor="fotoKegiatanUpload" className="cursor-pointer">
                    <div className="text-gray-400 text-xl mb-1">📷</div>
                    <div className="text-xs text-gray-400">{uploadingFoto ? 'Mengupload...' : 'Klik untuk upload foto'}</div>
                    <div className="text-xs text-gray-500 mt-1">Format: JPG, PNG (maks 10MB)</div>
                  </label>
                </div>
                {kegiatanForm.fotoUrl && (
                  <div className="mt-2">
                    <img src={kegiatanForm.fotoUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-green-400 text-xs">✓ Foto sudah diupload</span>
                      <button onClick={() => setKegiatanForm({ ...kegiatanForm, fotoUrl: '', fotoName: '' })}
                        className="text-red-400 text-xs underline">Hapus foto</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveKegiatan} className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg font-medium">Simpan</button>
              <button onClick={() => { setShowKegiatanForm(false); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}