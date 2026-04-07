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
    nama: '', jenis: '', penanggungjawab: '',
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
    setDonorForm({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' })
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
  <div style={{ minHeight: '100dvh', background: '#030712' }}>
    <Header />

    <main className="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto">
      <button onClick={() => router.push('/dashboard')}
        className="text-blue-400 text-sm mb-4 hover:text-blue-300 transition flex items-center gap-1">
        ← Dashboard
      </button>

      {/* Info proyek */}
      <div className="rounded-xl p-4 mb-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-semibold text-white text-base">{proyek?.nama}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-gray-500 text-xs">{proyek?.jenis}</span>
          {proyek?.wilayah && <><span className="text-gray-700">•</span><span className="text-gray-500 text-xs">{proyek.wilayah}</span></>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            proyek?.status === 'BERJALAN' ? 'bg-blue-500/10 text-blue-400' :
            proyek?.status === 'SELESAI' ? 'bg-emerald-500/10 text-emerald-400' :
            'bg-gray-500/10 text-gray-400'
          }`}>{statusLabel[proyek?.status || '']}</span>
        </div>
      </div>

      {/* Nav Tab */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { key: 'proyek', label: 'Data Proyek' },
          { key: 'donor', label: 'Pendonor' },
          { key: 'dokumen', label: 'Dokumen' },
          { key: 'keuangan', label: 'Keuangan' },
          { key: 'lainlain', label: 'Lain-Lain' },
        ].map((s) => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className="px-4 py-2 text-xs font-medium transition whitespace-nowrap rounded-t-lg"
            style={{
              color: activeSection === s.key ? '#60a5fa' : '#6b7280',
              borderBottom: activeSection === s.key ? '2px solid #2563eb' : '2px solid transparent',
              background: activeSection === s.key ? 'rgba(37,99,235,0.05)' : 'transparent',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* DATA PROYEK */}
      {activeSection === 'proyek' && (
        <div>
          <div className="px-4 py-2.5 rounded-xl font-bold text-xs mb-4 text-white uppercase tracking-wider"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>DATA PROJEK</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Jenis Proyek', key: 'jenis' },
              { label: 'Nama Pekerjaan', key: 'nama' },
              { label: 'Nilai Pekerjaan (Rp)', key: 'nilai' },
              { label: 'Penanggung Jawab', key: 'penanggungjawab' },
              { label: 'Wilayah Pengerjaan', key: 'wilayah' },
              { label: 'Sektor', key: 'sektor' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-1.5">{label} <span className="text-red-500">*</span></label>
                <input type={key === 'nilai' ? 'number' : 'text'}
                  value={editProyekForm[key as keyof typeof editProyekForm]}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, [key]: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none transition"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Tanggal Mulai <span className="text-red-500">*</span></label>
              <input type="date" value={editProyekForm.tanggalMulai}
                onChange={(e) => setEditProyekForm({ ...editProyekForm, tanggalMulai: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Tanggal Selesai</label>
              <input type="date" value={editProyekForm.tanggalSelesai}
                onChange={(e) => setEditProyekForm({ ...editProyekForm, tanggalSelesai: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Status <span className="text-red-500">*</span></label>
              <select value={editProyekForm.status}
                onChange={(e) => setEditProyekForm({ ...editProyekForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}>
                <option value="PERENCANAAN" className="bg-gray-900">Draft</option>
                <option value="BERJALAN" className="bg-gray-900">Sedang Diproses</option>
                <option value="SELESAI" className="bg-gray-900">Selesai</option>
              </select>
            </div>
          </div>
          <button onClick={handleUpdateProyek}
            className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            Simpan Perubahan
          </button>
        </div>
      )}

      {/* DATA PENDONOR */}
      {activeSection === 'donor' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>DATA PENDONOR</div>
            <button onClick={() => { setShowDonorForm(true); setEditDonor(null); setDonorForm({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' }) }}
              className="px-3 py-2 rounded-xl text-white text-xs font-medium whitespace-nowrap"
              style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
              + Tambah
            </button>
          </div>
          {donors.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">Belum ada data pendonor</p>
          ) : donors.map((d) => (
            <div key={d.id} className="rounded-xl mb-3 overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-4 py-2.5 font-semibold text-sm text-white"
                style={{ background: 'rgba(20,184,166,0.15)', borderBottom: '1px solid rgba(20,184,166,0.2)' }}>
                {d.nama}
              </div>
              <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="text-sm text-gray-400 mb-2">{d.alamat}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>Tahun Pendirian: <span className="text-gray-400">{d.tahunPendirian}</span></div>
                  <div>Lama Usaha: <span className="text-gray-400">{d.lamaUsaha} tahun</span></div>
                </div>
                <div className="mt-2 text-xs">
                  <div className="text-gray-600 mt-2 mb-1 uppercase tracking-wider text-xs">Pengurus</div>
                  <div className="text-gray-400">PJ: <span className="text-gray-300 font-medium">{d.penanggungjawab}</span></div>
                </div>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => { setEditDonor(d); setDonorForm({ nama: d.nama, jenis: d.jenis, penanggungjawab: d.penanggungjawab, wilayah: d.wilayah, alamat: d.alamat, tahunPendirian: d.tahunPendirian?.toString(), lamaUsaha: d.lamaUsaha?.toString() }); setShowDonorForm(true) }}
                    className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                  <button onClick={() => handleDeleteDonor(d.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD DOKUMEN */}
      {activeSection === 'dokumen' && (
        <div>
          <div className="px-4 py-2.5 rounded-xl font-bold text-xs mb-4 text-white uppercase tracking-wider"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>UPLOAD DOKUMEN</div>
          <div className="rounded-xl p-4 mb-5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Jenis Dokumen</label>
                <select value={selectedJenisDokumen} onChange={(e) => setSelectedJenisDokumen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}>
                  <option value="KONTRAK_KERJA" className="bg-gray-900">Kontrak Kerja</option>
                  <option value="PROPOSAL" className="bg-gray-900">Proposal</option>
                  <option value="SURAT_IZIN" className="bg-gray-900">Surat Izin</option>
                  <option value="DOKUMENTASI_KEGIATAN" className="bg-gray-900">Dokumentasi Kegiatan</option>
                  <option value="LAPORAN_PEKERJAAN" className="bg-gray-900">Laporan Pekerjaan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">File</label>
                <div className="rounded-xl p-4 text-center cursor-pointer transition"
                  style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadDokumen} className="hidden" id="fileUpload" />
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    <div className="text-2xl mb-1">📎</div>
                    <div className="text-xs text-gray-500">{uploading ? 'Mengupload...' : 'Klik untuk upload'}</div>
                    <div className="text-xs text-gray-700 mt-1">PDF, JPG, PNG (maks 10MB)</div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          {dokumen.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">Belum ada dokumen</p>
          ) : (
            <div className="space-y-2">
              {dokumen.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="text-sm text-gray-300">{d.fileName}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {jenisDokumenLabel[d.jenisDokumen]} • {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 text-xs hover:text-blue-300 transition">Download</a>
                    <button onClick={() => handleDeleteDokumen(d.id, d.fileUrl)}
                      className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KEUANGAN */}
      {activeSection === 'keuangan' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>KEUANGAN</div>
            <button onClick={() => { setShowTransaksiForm(true); setEditTransaksi(null); resetTransaksiForm() }}
              className="px-3 py-2 rounded-xl text-white text-xs font-medium whitespace-nowrap"
              style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
              + Pembayaran
            </button>
          </div>

          <div className="rounded-xl p-4 mb-4"
            style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <div className="text-xs text-gray-600">Total Pembayaran</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {formatRupiah(transaksi.reduce((acc, t) => acc + t.jumlah, 0))}
            </div>
          </div>

          {transaksi.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">Belum ada transaksi</p>
          ) : transaksi.map((t) => (
            <div key={t.id} className="rounded-xl p-4 mb-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs flex-1">
                  <div><span className="text-gray-600">Jenis: </span><span className="text-gray-300">{t.jenisPembayaran}</span></div>
                  <div><span className="text-gray-600">Keterangan: </span><span className="text-gray-300">{t.keterangan}</span></div>
                  {t.bankTujuan && <div><span className="text-gray-600">Bank: </span><span className="text-gray-300">{t.bankTujuan}</span></div>}
                  {t.nomorRekening && <div><span className="text-gray-600">Rekening: </span><span className="text-gray-300">{t.nomorRekening}</span></div>}
                  <div><span className="text-gray-600">Tanggal: </span><span className="text-gray-300">{new Date(t.tanggalPembayaran).toLocaleDateString('id-ID')}</span></div>
                  <div><span className="text-gray-600">Jumlah: </span><span className="text-emerald-400 font-medium">{formatRupiah(t.jumlah)}</span></div>
                  {t.buktiBayarUrl && (
                    <div className="col-span-2">
                      <a href={t.buktiBayarUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 text-xs hover:text-blue-300 transition">Lihat Bukti →</a>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button onClick={() => {
                    setEditTransaksi(t)
                    setTransaksiForm({ jenisPembayaran: t.jenisPembayaran, keterangan: t.keterangan, nomorRekening: t.nomorRekening || '', bankTujuan: t.bankTujuan || '', jumlah: t.jumlah.toString(), tanggalPembayaran: t.tanggalPembayaran.split('T')[0], buktiBayarUrl: t.buktiBayarUrl || '' })
                    setShowTransaksiForm(true)
                  }} className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                  <button onClick={() => handleDeleteTransaksi(t.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LAIN-LAIN */}
      {activeSection === 'lainlain' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>LAIN-LAIN</div>
            <button onClick={() => { setShowKegiatanForm(true); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }}
              className="px-3 py-2 rounded-xl text-white text-xs font-medium whitespace-nowrap"
              style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
              + Kegiatan
            </button>
          </div>
          {kegiatan.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">Belum ada kegiatan</p>
          ) : (
            <div className="space-y-3">
              {kegiatan.map((k) => (
                <div key={k.id} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-200 text-sm">{k.namaKegiatan}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {new Date(k.tanggalKegiatan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      {k.fotoUrl && (
                        <div className="mt-3">
                          <img src={k.fotoUrl} alt={k.namaKegiatan}
                            className="w-40 h-28 object-cover rounded-lg"
                            style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                          <a href={k.fotoUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 text-xs hover:text-blue-300 transition mt-1 block">Lihat lengkap →</a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 ml-4">
                      <button onClick={() => { setEditKegiatan(k); setKegiatanForm({ namaKegiatan: k.namaKegiatan, tanggalKegiatan: k.tanggalKegiatan.split('T')[0], fotoUrl: k.fotoUrl || '', fotoName: k.fotoName || '' }); setShowKegiatanForm(true) }}
                        className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                      <button onClick={() => handleDeleteKegiatan(k.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
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
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-base font-semibold text-white mb-5">{editDonor ? 'Edit Donor' : 'Tambah Donor'}</h3>
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
                <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                <input type={['nilai', 'tahunPendirian', 'lamaUsaha'].includes(key) ? 'number' : 'text'}
                  value={donorForm[key as keyof typeof donorForm]}
                  onChange={(e) => setDonorForm({ ...donorForm, [key]: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSaveDonor}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>Simpan</button>
            <button onClick={() => { setShowDonorForm(false); setEditDonor(null) }}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>Batal</button>
          </div>
        </div>
      </div>
    )}

    {/* Modal Transaksi */}
    {showTransaksiForm && (
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-base font-semibold text-white mb-5">{editTransaksi ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Jenis Pembayaran</label>
              <select value={transaksiForm.jenisPembayaran}
                onChange={(e) => setTransaksiForm({ ...transaksiForm, jenisPembayaran: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}>
                <option value="TUNAI" className="bg-gray-900">Tunai</option>
                <option value="NONTUNAI" className="bg-gray-900">Non-Tunai</option>
              </select>
            </div>
            {[
              { label: 'Keterangan', key: 'keterangan' },
              { label: 'Nomor Rekening', key: 'nomorRekening' },
              { label: 'Bank Tujuan', key: 'bankTujuan' },
              { label: 'Jumlah (Rp)', key: 'jumlah' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                <input type={key === 'jumlah' ? 'number' : 'text'}
                  value={transaksiForm[key as keyof typeof transaksiForm]}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, [key]: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Tanggal Pembayaran</label>
              <input type="date" value={transaksiForm.tanggalPembayaran}
                onChange={(e) => setTransaksiForm({ ...transaksiForm, tanggalPembayaran: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Bukti Pembayaran</label>
              <div className="rounded-xl p-4 text-center"
                style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <input ref={buktiBayarRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleUploadBuktiBayar} className="hidden" id="buktiBayarUpload" />
                <label htmlFor="buktiBayarUpload" className="cursor-pointer">
                  <div className="text-xl mb-1">📎</div>
                  <div className="text-xs text-gray-500">{uploadingBukti ? 'Mengupload...' : 'Klik untuk upload'}</div>
                </label>
              </div>
              {transaksiForm.buktiBayarUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-emerald-400 text-xs">✓ Terupload</span>
                  <a href={transaksiForm.buktiBayarUrl} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 text-xs hover:text-blue-300 transition">Lihat →</a>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSaveTransaksi}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>Simpan</button>
            <button onClick={() => { setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm() }}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>Batal</button>
          </div>
        </div>
      </div>
    )}

    {/* Modal Kegiatan */}
    {showKegiatanForm && (
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-base font-semibold text-white mb-5">{editKegiatan ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Nama Kegiatan *</label>
              <input type="text" value={kegiatanForm.namaKegiatan}
                onChange={(e) => setKegiatanForm({ ...kegiatanForm, namaKegiatan: e.target.value })}
                placeholder="Masukkan nama kegiatan"
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Tanggal Kegiatan *</label>
              <input type="date" value={kegiatanForm.tanggalKegiatan}
                onChange={(e) => setKegiatanForm({ ...kegiatanForm, tanggalKegiatan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Foto Dokumentasi</label>
              <div className="rounded-xl p-4 text-center"
                style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <input ref={fotoKegiatanRef} type="file" accept=".jpg,.jpeg,.png"
                  onChange={handleUploadFotoKegiatan} className="hidden" id="fotoKegiatanUpload" />
                <label htmlFor="fotoKegiatanUpload" className="cursor-pointer">
                  <div className="text-xl mb-1">📷</div>
                  <div className="text-xs text-gray-500">{uploadingFoto ? 'Mengupload...' : 'Klik untuk upload foto'}</div>
                </label>
              </div>
              {kegiatanForm.fotoUrl && (
                <div className="mt-2">
                  <img src={kegiatanForm.fotoUrl} alt="Preview"
                    className="w-full h-28 object-cover rounded-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-400 text-xs">✓ Terupload</span>
                    <button onClick={() => setKegiatanForm({ ...kegiatanForm, fotoUrl: '', fotoName: '' })}
                      className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSaveKegiatan}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>Simpan</button>
            <button onClick={() => { setShowKegiatanForm(false); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }}
              className="flex-1 py-2.5 rounded-xl text-sm text-gray-400"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>Batal</button>
          </div>
        </div>
      </div>
    )}
  </div>
)
}