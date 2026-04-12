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
  status: string
  catatanAdmin: string
  approvedByName?: string
  approvedAt?: string
}
interface Transaksi {
  id: string
  namaProgram?: string
  kegiatan?: string
  staffCA?: string
  tanggalPengajuan?: string
  tanggalPertanggungjawaban?: string
  kelengkapanDokumen?: string
  statusTransaksi?: string
  jenisPembayaran: string
  keterangan?: string
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
interface TransaksiForm {
  namaProgram: string
  kegiatan: string
  staffCA: string
  tanggalPengajuan: string
  tanggalPertanggungjawaban: string
  kelengkapanDokumen: string
  jumlah: string
  statusTransaksi: string
  keterangan: string
  jenisPembayaran: string
  nomorRekening: string
  bankTujuan: string
  tanggalPembayaran: string
  buktiBayarUrl: string
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
  const [isOwner, setIsOwner] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [activeSection, setActiveSection] = useState('proyek')

  const [showRequestEditModal, setShowRequestEditModal] = useState(false)
  const [requestEditNote, setRequestEditNote] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)

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
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedDokumen, setSelectedDokumen] = useState<Dokumen | null>(null)
  const [catatanAdmin, setCatatanAdmin] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)

  const [donorForm, setDonorForm] = useState({
    nama: '', jenis: '', penanggungjawab: '',
    wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: ''
  })
  const [kegiatanForm, setKegiatanForm] = useState({
    namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: ''
  })
  const [editProyekForm, setEditProyekForm] = useState({
    nama: '', jenis: '', nilai: '', penanggungjawab: '',
    wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: ''
  })

  const [transaksiForm, setTransaksiForm] = useState<TransaksiForm>({
    namaProgram: '',
    kegiatan: '',
    staffCA: '',
    tanggalPengajuan: '',
    tanggalPertanggungjawaban: '',
    kelengkapanDokumen: 'Lengkap',
    jumlah: '0',
    statusTransaksi: 'Transfer successful',
    keterangan: '',
    jenisPembayaran: 'TUNAI',
    nomorRekening: '',
    bankTujuan: '',
    tanggalPembayaran: '',
    buktiBayarUrl: ''
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

    const currentUserId = (session?.user as any)?.id
    const currentRole = (session?.user as any)?.role
    setIsOwner(currentRole === 'ADMIN' || p.userId === currentUserId)

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

    const hasApproved = Array.isArray(dokumenData) && dokumenData.some((d: any) => d.status === 'APPROVED')
    setIsLocked(hasApproved)
  }

  const handleUpdateProyek = async () => {
    if (isLocked && (session?.user as any)?.role !== 'ADMIN') {
      alert('Proyek terkunci karena sudah ada dokumen yang disetujui. Hubungi Admin untuk melakukan perubahan.')
      return
    }
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
    if (isLocked && (session?.user as any)?.role === 'ADMIN') {
      alert('🔒 Proyek terkunci! Ada dokumen yang sudah disetujui. Ajukan izin edit ke Admin.')
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) { alert('Format file harus PDF, JPG, atau PNG!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }

    setUploading(true)
    let attempt = 0
    const maxAttempts = 3

    while (attempt < maxAttempts) {
      attempt++
      try {
        console.log(`Upload dokumen attempt ${attempt}...`)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', id)
        formData.append('bucket', 'dokumen')

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal')

        await fetch('/api/dokumen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jenisDokumen: selectedJenisDokumen,
            fileUrl: uploadData.fileUrl,
            fileName: uploadData.fileName,
            projectId: id
          })
        })

        fetchAll2()
        alert('Dokumen berhasil diupload!')
        break

      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error)
        if (attempt >= maxAttempts) {
          alert(`Gagal upload setelah ${maxAttempts}x percobaan.\n${error.message}\n\nCoba cek koneksi internet kamu.`)
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUploadBuktiBayar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) { alert('Format file harus JPG, PNG, atau PDF!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }

    setUploadingBukti(true)
    let attempt = 0

    while (attempt < 3) {
      attempt++
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
        break
      } catch (error: any) {
        if (attempt >= 3) {
          alert(`Gagal upload: ${error.message}`)
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }
    }

    setUploadingBukti(false)
    if (buktiBayarRef.current) buktiBayarRef.current.value = ''
  }

  const handleUploadFotoKegiatan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) { alert('Format file harus JPG atau PNG!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }

    setUploadingFoto(true)
    let attempt = 0

    while (attempt < 3) {
      attempt++
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
        break
      } catch (error: any) {
        if (attempt >= 3) {
          alert(`Gagal upload: ${error.message}`)
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }
    }

    setUploadingFoto(false)
    if (fotoKegiatanRef.current) fotoKegiatanRef.current.value = ''
  }

  const handleDeleteDokumen = async (dokumenId: string, fileUrl: string) => {
    if (!confirm('Yakin hapus dokumen ini?')) return
    const fileName = fileUrl.split('/dokumen/')[1]
    if (fileName) await supabase.storage.from('dokumen').remove([fileName])
    await fetch(`/api/dokumen/${dokumenId}`, { method: 'DELETE' })
    fetchAll2()
  }
  const handleApproval = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedDokumen) return
    setApprovalLoading(true)
    try {
      const res = await fetch(`/api/dokumen/${selectedDokumen.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, catatanAdmin })
      })
      if (!res.ok) throw new Error('Gagal update status')
      setShowApprovalModal(false)
      setSelectedDokumen(null)
      setCatatanAdmin('')
      fetchAll2()
      alert(status === 'APPROVED' ? '✓ Dokumen disetujui!' : '✗ Dokumen ditolak!')
    } catch (error) {
      alert('Gagal: ' + String(error))
    } finally {
      setApprovalLoading(false)
    }
  }
  const resetTransaksiForm = () => {
    setTransaksiForm({
      namaProgram: '',
      kegiatan: '',
      staffCA: '',
      tanggalPengajuan: '',
      tanggalPertanggungjawaban: '',
      kelengkapanDokumen: 'Lengkap',
      jumlah: '0',
      statusTransaksi: 'Transfer successful',
      keterangan: '',
      jenisPembayaran: 'TUNAI',
      nomorRekening: '',
      bankTujuan: '',
      tanggalPembayaran: '',
      buktiBayarUrl: ''
    })
    if (buktiBayarRef.current) buktiBayarRef.current.value = ''
  }
  const handleSaveTransaksi = async () => {
    if (!transaksiForm.namaProgram.trim()) {
      alert('Nama Program wajib diisi!')
      return
    }
    if (!transaksiForm.staffCA.trim()) {
      alert('Staff CA wajib diisi!')
      return
    }
    if (!transaksiForm.tanggalPengajuan) {
      alert('Tanggal Pengajuan wajib diisi!')
      return
    }

    const payload = {
      ...transaksiForm,
      projectId: id,
      // Map ke field lama untuk kompatibilitas
      jenisPembayaran: transaksiForm.jenisPembayaran || 'TUNAI',
      keterangan: transaksiForm.keterangan || transaksiForm.namaProgram,
      jumlah: parseFloat(transaksiForm.jumlah) || 0,
      tanggalPembayaran: transaksiForm.tanggalPengajuan,
    }

    if (editTransaksi) {
      await fetch(`/api/transaksi/${editTransaksi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
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
  const handleRequestEdit = async () => {
    setRequestLoading(true)
    try {
      await fetch(`/api/proyek/${id}/request-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: requestEditNote })
      })
      alert('✓ Permintaan edit telah dikirim ke Admin!')
      setShowRequestEditModal(false)
      setRequestEditNote('')
    } catch {
      alert('Gagal mengirim permintaan')
    } finally {
      setRequestLoading(false)
    }
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

  const LockBanner = () => {
    if ((session?.user as any)?.role === 'ADMIN') return null

    if (isLocked && isOwner) return (
      <div className="mb-4 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-yellow-400 mb-1">🔒 Proyek Terkunci</div>
            <div className="text-xs text-gray-500">Ada dokumen yang sudah disetujui. Ajukan izin edit ke Admin.</div>
          </div>
          <button onClick={() => setShowRequestEditModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0"
            style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#facc15' }}>
            Ajukan Edit
          </button>
        </div>
      </div>
    )
    if (!isOwner) return (
      <div className="mb-4 px-4 py-3 rounded-xl text-xs"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
        ⚠ Kamu hanya bisa melihat data proyek ini
      </div>
    )
    return null
  }

  if (loading) return <Loading />

  return (
    <div style={{ minHeight: '100dvh', background: '#030712' }}>
      <Header />

      <main className="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-blue-400 text-sm mb-4 hover:text-blue-300 transition flex items-center gap-1"
        >
          ← Dashboard
        </button>

        {/* Info proyek */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="font-semibold text-white text-base">{proyek?.nama}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-gray-500 text-xs">{proyek?.jenis}</span>
            {proyek?.wilayah && (
              <>
                <span className="text-gray-700">•</span>
                <span className="text-gray-500 text-xs">{proyek.wilayah}</span>
              </>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${proyek?.status === 'BERJALAN'
                ? 'bg-blue-500/10 text-blue-400'
                : proyek?.status === 'SELESAI'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-gray-500/10 text-gray-400'
                }`}
            >
              {statusLabel[proyek?.status || '']}
            </span>
          </div>
        </div>

        {/* Nav Tab */}
        <div
          className="flex gap-1 mb-6 overflow-x-auto pb-1"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { key: 'proyek', label: 'Data Proyek' },
            { key: 'donor', label: 'Pendonor' },
            { key: 'dokumen', label: 'Dokumen' },
            { key: 'keuangan', label: 'Keuangan' },
            { key: 'lainlain', label: 'Lain-Lain' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className="px-4 py-2 text-xs font-medium transition whitespace-nowrap rounded-t-lg"
              style={{
                color: activeSection === s.key ? '#60a5fa' : '#6b7280',
                borderBottom: activeSection === s.key ? '2px solid #2563eb' : '2px solid transparent',
                background: activeSection === s.key ? 'rgba(37,99,235,0.05)' : 'transparent',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* DATA PROYEK */}
        {activeSection === 'proyek' && (
          <div>
            <div className="px-4 py-2.5 rounded-xl font-bold text-xs mb-4 text-white uppercase tracking-wider"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>DATA PROJEK</div>
            <LockBanner />
            {/* Warning bukan owner */}
            {!isOwner && !isLocked && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                ⚠ Kamu tidak memiliki akses untuk mengedit proyek ini
              </div>
            )}

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
                  <input
                    type={key === 'nilai' ? 'number' : 'text'}
                    value={editProyekForm[key as keyof typeof editProyekForm]}
                    onChange={(e) => setEditProyekForm({ ...editProyekForm, [key]: e.target.value })}
                    disabled={!isOwner}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition"
                    style={{
                      background: !isOwner ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: !isOwner ? '#6b7280' : '#fff',
                      cursor: !isOwner ? 'not-allowed' : 'text'
                    }} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Tanggal Mulai *</label>
                <input type="date" value={editProyekForm.tanggalMulai}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, tanggalMulai: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: !isOwner ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: !isOwner ? '#6b7280' : '#fff',
                    colorScheme: 'dark',
                    cursor: !isOwner ? 'not-allowed' : 'default'
                  }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Tanggal Selesai</label>
                <input type="date" value={editProyekForm.tanggalSelesai}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, tanggalSelesai: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: !isOwner ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: !isOwner ? '#6b7280' : '#fff',
                    colorScheme: 'dark',
                    cursor: !isOwner ? 'not-allowed' : 'default'
                  }} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Status *</label>
                <select value={editProyekForm.status}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, status: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: !isOwner ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: !isOwner ? '#6b7280' : '#fff',
                    colorScheme: 'dark',
                    cursor: !isOwner ? 'not-allowed' : 'default'
                  }}>
                  <option value="PERENCANAAN" className="bg-gray-900">Draft</option>
                  <option value="BERJALAN" className="bg-gray-900">Sedang Diproses</option>
                  <option value="SELESAI" className="bg-gray-900">Selesai</option>
                </select>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={handleUpdateProyek}
                disabled={isLocked && (session?.user as any)?.role !== 'ADMIN'}
                className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                {isLocked && (session?.user as any)?.role !== 'ADMIN' ? '🔒 Terkunci' : 'Simpan Perubahan'}
              </button>
            )}
          </div>
        )}
        {/* DATA PENDONOR */}
        {activeSection === 'donor' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>DATA PENDONOR</div>
              {isOwner && !isLocked && (
                <button onClick={() => { setShowDonorForm(true); setEditDonor(null); setDonorForm({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' }) }}
                  className="px-3 py-2 rounded-xl text-white text-xs font-medium whitespace-nowrap"
                  style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
                  + Tambah
                </button>
              )}
            </div>
            <LockBanner />
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
                  {isOwner && !isLocked && (
                    <div className="flex gap-3 mt-3">
                      <button onClick={() => {
                        setEditDonor(d)
                        setDonorForm({ nama: d.nama, jenis: d.jenis, penanggungjawab: d.penanggungjawab, wilayah: d.wilayah, alamat: d.alamat, tahunPendirian: d.tahunPendirian?.toString(), lamaUsaha: d.lamaUsaha?.toString() })
                        setShowDonorForm(true)
                      }} className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                      <button onClick={() => handleDeleteDonor(d.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                    </div>
                  )}
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
            < LockBanner />

            {!isOwner && !isLocked && (
              <div className="mb-4 px-4 py-3 rounded-xl text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                ⚠ Kamu hanya bisa melihat dokumen proyek ini
              </div>
            )}

            {/* Form Upload — hanya owner */}
            {isOwner && (
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
                    <div
                      className={`rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${isLocked && (session?.user as any)?.role !== 'ADMIN'
                          ? 'cursor-not-allowed opacity-60'
                          : ''
                        }`}
                      style={{
                        border: isLocked && (session?.user as any)?.role !== 'ADMIN'
                          ? '2px dashed rgba(239,68,68,0.4)'  // 🔴 Red lock border
                          : uploading
                            ? '2px dashed rgba(37,99,235,0.4)' // 🔵 Upload border
                            : '2px dashed rgba(255,255,255,0.15)', // Normal
                        background: isLocked && (session?.user as any)?.role !== 'ADMIN'
                          ? 'rgba(239,68,68,0.05)'  // 🔴 Red tint
                          : uploading
                            ? 'rgba(37,99,235,0.08)' // 🔵 Upload tint
                            : 'rgba(255,255,255,0.025)' // Normal
                      }}
                      title={isLocked && (session?.user as any)?.role !== 'ADMIN'
                        ? 'Proyek terkunci - hubungi Admin'
                        : 'Klik untuk upload'
                      }
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleUploadDokumen}
                        className="hidden"
                        id="fileUpload"
                        disabled={isLocked && (session?.user as any)?.role !== 'ADMIN'}
                      />

                      {isLocked && (session?.user as any)?.role !== 'ADMIN' ? (
                        <>
                          <div className="text-2xl mb-2">🔒</div>
                          <div className="text-xs font-medium text-red-400 mb-1">TERKUNCI</div>
                          <div className="text-xs text-red-500">Dokumen approved</div>
                          <div className="text-xs text-gray-500 mt-1">Ajukan edit ke Admin</div>
                        </>
                      ) : uploading ? (
                        <>
                          <div className="text-2xl mb-2 animate-spin">⏳</div>
                          <div className="text-xs font-medium text-blue-400 mb-1">Mengupload...</div>
                          <div className="text-xs text-gray-400">Jangan tutup halaman</div>
                        </>
                      ) : (
                        // ✅ NORMAL STATE
                        <>
                          <div className="text-2xl mb-2">📎</div>
                          <div className="text-xs font-medium text-gray-300 mb-1">Klik untuk upload</div>
                          <div className="text-xs text-gray-500">PDF, JPG, PNG (maks 10MB)</div>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {isLocked && (session?.user as any)?.role !== 'ADMIN'
                        ? 'Admin bisa upload meski terkunci'
                        : 'Upload otomatis simpan ke database'
                      }
                    </p>
                  </div>
                </div>
              </div>
        )}

        {/* Legend */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">⏳ Menunggu</span>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">✓ Disetujui</span>
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">✗ Ditolak</span>
        </div>

        {/* List Dokumen */}
        {dokumen.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-10">Belum ada dokumen</p>
        ) : (
          <div className="space-y-3">
            {dokumen.map((d) => (
              <div key={d.id} className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: d.status === 'APPROVED' ? '1px solid rgba(52,211,153,0.2)' :
                    d.status === 'REJECTED' ? '1px solid rgba(239,68,68,0.2)' :
                      '1px solid rgba(255,255,255,0.06)'
                }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 font-medium truncate">{d.fileName}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {jenisDokumenLabel[d.jenisDokumen]} • {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${d.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        d.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                        {d.status === 'APPROVED' ? '✓ Disetujui' :
                          d.status === 'REJECTED' ? '✗ Ditolak' : '⏳ Menunggu'}
                      </span>
                    </div>
                    {d.catatanAdmin && (
                      <div className="mt-2 px-3 py-2 rounded-lg text-xs"
                        style={{
                          background: d.status === 'REJECTED' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
                          border: d.status === 'REJECTED' ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.06)'
                        }}>
                        <span className="text-gray-500">Catatan Admin: </span>
                        <span className="text-gray-300 italic">"{d.catatanAdmin}"</span>
                      </div>
                    )}
                    {d.approvedByName && d.approvedAt && (
                      <div className="mt-1 text-xs text-gray-700">
                        oleh {d.approvedByName} • {new Date(d.approvedAt).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-400 text-xs hover:text-blue-300 transition">Download</a>

                    {/* Tombol Review hanya Admin */}
                    {(session?.user as any)?.role === 'ADMIN' && (
                      <button onClick={() => { setSelectedDokumen(d); setCatatanAdmin(d.catatanAdmin || ''); setShowApprovalModal(true) }}
                        className="text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                        style={{
                          background: d.status === 'PENDING' ? 'rgba(234,179,8,0.15)' : 'rgba(37,99,235,0.15)',
                          border: d.status === 'PENDING' ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(37,99,235,0.3)',
                          color: d.status === 'PENDING' ? '#facc15' : '#60a5fa'
                        }}>
                        {d.status === 'PENDING' ? 'Review' : 'Ubah Status'}
                      </button>
                    )}

                    {/* Hapus hanya owner dan dokumen belum approved */}
                    {isOwner && d.status !== 'APPROVED' && (
                      <button onClick={() => handleDeleteDokumen(d.id, d.fileUrl)}
                        className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
{/* KEUANGAN */ }
{
  activeSection === 'keuangan' && (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>KEUANGAN</div>
        {isOwner && !isLocked && (
          <button onClick={() => { setShowTransaksiForm(true); setEditTransaksi(null); resetTransaksiForm() }}
            className="px-3 py-2 rounded-xl text-white text-xs font-medium whitespace-nowrap"
            style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
            + Pembayaran
          </button>
        )}
      </div>
      <LockBanner />

      <div className="rounded-xl p-4 mb-4"
        style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
        <div className="text-xs text-gray-600">Total Pembayaran</div>
        <div className="text-xl font-bold text-emerald-400 mt-1">
          {formatRupiah(transaksi.reduce((acc, t) => acc + t.jumlah, 0))}
        </div>
      </div>

      {transaksi.map((t) => (
        <div key={t.id} className="rounded-xl p-4 mb-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-medium text-gray-200">{(t as any).namaProgram || t.keterangan || '-'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${(t as any).statusTransaksi === 'Transfer successful' ? 'bg-emerald-500/10 text-emerald-400' :
                  (t as any).statusTransaksi === 'Settlement' ? 'bg-blue-500/10 text-blue-400' :
                    (t as any).statusTransaksi === 'clear' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-yellow-500/10 text-yellow-400'
                  }`}>
                  {(t as any).statusTransaksi || t.jenisPembayaran}
                </span>
                {(t as any).keterangan && (
                  <span className="text-xs text-gray-600 italic">{(t as any).keterangan}</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                {(t as any).kegiatan && <div><span className="text-gray-600">Kegiatan: </span><span className="text-gray-300">{(t as any).kegiatan}</span></div>}
                {(t as any).staffCA && <div><span className="text-gray-600">Staff CA: </span><span className="text-gray-300">{(t as any).staffCA}</span></div>}
                {(t as any).tanggalPengajuan && <div><span className="text-gray-600">Tgl Pengajuan: </span><span className="text-gray-300">{new Date((t as any).tanggalPengajuan).toLocaleDateString('id-ID')}</span></div>}
                {(t as any).tanggalPertanggungjawaban && <div><span className="text-gray-600">Tgl PJ: </span><span className="text-gray-300">{new Date((t as any).tanggalPertanggungjawaban).toLocaleDateString('id-ID')}</span></div>}
                {(t as any).kelengkapanDokumen && (
                  <div>
                    <span className="text-gray-600">Dok: </span>
                    <span className={(t as any).kelengkapanDokumen === 'Lengkap' ? 'text-emerald-400' : 'text-orange-400'}>
                      {(t as any).kelengkapanDokumen}
                    </span>
                  </div>
                )}
                <div><span className="text-gray-600">Nominal: </span><span className="text-emerald-400 font-medium">{formatRupiah(t.jumlah)}</span></div>
              </div>

              {t.buktiBayarUrl && (
                <a href={t.buktiBayarUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:text-blue-300 transition mt-2 inline-block">
                  Lihat Bukti →
                </a>
              )}
            </div>

            {isOwner && !isLocked && (
              <div className="flex flex-col gap-2 ml-4">
                <button onClick={() => {
                  setEditTransaksi(t)
                  setTransaksiForm({
                    namaProgram: (t as any).namaProgram || '',
                    kegiatan: (t as any).kegiatan || '',
                    staffCA: (t as any).staffCA || '',
                    tanggalPengajuan: (t as any).tanggalPengajuan?.split('T')[0] || '',
                    tanggalPertanggungjawaban: (t as any).tanggalPertanggungjawaban?.split('T')[0] || '',
                    kelengkapanDokumen: (t as any).kelengkapanDokumen || 'Lengkap',
                    jumlah: t.jumlah.toString(),
                    statusTransaksi: (t as any).statusTransaksi || 'Transfer successful',
                    keterangan: (t as any).keterangan || '',
                    jenisPembayaran: t.jenisPembayaran || 'TUNAI',
                    nomorRekening: t.nomorRekening || '',
                    bankTujuan: t.bankTujuan || '',
                    tanggalPembayaran: t.tanggalPembayaran?.split('T')[0] || '',
                    buktiBayarUrl: t.buktiBayarUrl || ''
                  })
                  setShowTransaksiForm(true)
                }} className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                <button onClick={() => handleDeleteTransaksi(t.id)}
                  className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

{/* LAIN-LAIN */ }
{
  activeSection === 'lainlain' && (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>LAIN-LAIN</div>
        {isOwner && !isLocked && (
          <button onClick={() => { setShowKegiatanForm(true); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }}
            className="px-3 py-2 rounded-xl text-white text-xs font-medium whitespace-nowrap"
            style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
              + Tambah Kegiatan
          </button>
        )}
      </div>
      <LockBanner />

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
                {isOwner && !isLocked && (
                  <div className="flex gap-3 ml-4">
                    <button onClick={() => {
                      setEditKegiatan(k)
                      setKegiatanForm({ namaKegiatan: k.namaKegiatan, tanggalKegiatan: k.tanggalKegiatan.split('T')[0], fotoUrl: k.fotoUrl || '', fotoName: k.fotoName || '' })
                      setShowKegiatanForm(true)
                    }} className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                    <button onClick={() => handleDeleteKegiatan(k.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
      </main >

  {/* Modal Donor */ }
{
  showDonorForm && (
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
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
              <input type={['tahunPendirian', 'lamaUsaha'].includes(key) ? 'number' : 'text'}
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
  )
}

{/* Modal Transaksi */ }
{
  showTransaksiForm && (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-base font-semibold text-white mb-5">
          {editTransaksi ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
        </h3>

        {/* Grid 3 kolom seperti foto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Nama Program <span className="text-red-400">*</span>
            </label>
            <input type="text"
              placeholder="ketik..."
              value={transaksiForm.namaProgram}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, namaProgram: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Kegiatan</label>
            <input type="text"
              placeholder="ketik..."
              value={transaksiForm.kegiatan}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, kegiatan: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Staff CA <span className="text-red-400">*</span>
            </label>
            <input type="text"
              placeholder="ketik..."
              value={transaksiForm.staffCA}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, staffCA: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Tanggal Pengajuan <span className="text-red-400">*</span>
            </label>
            <input type="date"
              value={transaksiForm.tanggalPengajuan}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, tanggalPengajuan: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Tanggal Pertanggungjawaban</label>
            <input type="date"
              value={transaksiForm.tanggalPertanggungjawaban}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, tanggalPertanggungjawaban: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Kelengkapan Dokumen</label>
            <select
              value={transaksiForm.kelengkapanDokumen}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, kelengkapanDokumen: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}>
              <option value="Lengkap" className="bg-gray-900">Lengkap</option>
              <option value="Kurang" className="bg-gray-900">Kurang</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Nominal Transaksi</label>
            <input type="number"
              placeholder="0"
              value={transaksiForm.jumlah}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, jumlah: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Status</label>
            <select
              value={transaksiForm.statusTransaksi}
              onChange={(e) => setTransaksiForm({ ...transaksiForm, statusTransaksi: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}>
              <option value="Transfer successful" className="bg-gray-900">Transfer successful</option>
              <option value="Settlement" className="bg-gray-900">Settlement</option>
              <option value="clear" className="bg-gray-900">clear</option>
              <option value="Pending" className="bg-gray-900">Pending</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Keterangan</label>
          <input type="text"
            placeholder="Keterangan tambahan..."
            value={transaksiForm.keterangan}
            onChange={(e) => setTransaksiForm({ ...transaksiForm, keterangan: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        {/* Bukti Pembayaran */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-1.5">Bukti Pembayaran</label>
          <div className="rounded-xl p-3 text-center"
            style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <input ref={buktiBayarRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleUploadBuktiBayar} className="hidden" id="buktiBayarUpload" />
            <label htmlFor="buktiBayarUpload" className="cursor-pointer">
              <div className="text-lg mb-1">📎</div>
              <div className="text-xs text-gray-500">{uploadingBukti ? 'Mengupload...' : 'Klik untuk upload'}</div>
            </label>
          </div>
          {transaksiForm.buktiBayarUrl && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-emerald-400 text-xs">✓ Terupload</span>
              <a href={transaksiForm.buktiBayarUrl} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 text-xs hover:text-blue-300">Lihat →</a>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={handleSaveTransaksi}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
            Simpan
          </button>
          <button onClick={() => { setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm() }}
            className="flex-1 py-2.5 rounded-xl text-sm text-gray-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}
{/* Modal Kegiatan */ }
{
  showKegiatanForm && (
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
  )
}
{
  showApprovalModal && selectedDokumen && (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>

        <h3 className="text-base font-semibold text-white mb-1">Review Dokumen</h3>
        <p className="text-sm text-gray-500 mb-1 truncate">{selectedDokumen.fileName}</p>
        <p className="text-xs text-gray-600 mb-5">{jenisDokumenLabel[selectedDokumen.jenisDokumen]}</p>

        {/* Status saat ini */}
        <div className="mb-4">
          <span className="text-xs text-gray-600">Status saat ini: </span>
          <span className={`text-xs font-medium ${selectedDokumen.status === 'APPROVED' ? 'text-emerald-400' :
            selectedDokumen.status === 'REJECTED' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
            {selectedDokumen.status === 'APPROVED' ? 'Disetujui' :
              selectedDokumen.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
          </span>
        </div>

        {/* Textarea catatan */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-1.5">
            Catatan untuk user <span className="text-gray-700">(opsional)</span>
          </label>
          <textarea
            value={catatanAdmin}
            onChange={(e) => setCatatanAdmin(e.target.value)}
            placeholder="Contoh: Dokumen sudah sesuai / Mohon lengkapi tanda tangan..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* Tombol aksi */}
        <div className="flex gap-3">
          <button
            onClick={() => handleApproval('APPROVED')}
            disabled={approvalLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}>
            {approvalLoading ? '...' : '✓ Setujui'}
          </button>
          <button
            onClick={() => handleApproval('REJECTED')}
            disabled={approvalLoading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
            {approvalLoading ? '...' : '✗ Tolak'}
          </button>
          <button
            onClick={() => { setShowApprovalModal(false); setSelectedDokumen(null); setCatatanAdmin('') }}
            disabled={approvalLoading}
            className="px-4 py-2.5 rounded-xl text-sm text-gray-500 transition disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}
{/* Modal Request Edit */ }
{
  showRequestEditModal && (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-base font-semibold text-white mb-1">Ajukan Permintaan Edit</h3>
        <p className="text-xs text-gray-500 mb-5">
          Permintaan akan dikirim ke Admin. Admin akan membuka kunci proyek jika disetujui.
        </p>

        <div className="mb-5">
          <label className="block text-xs text-gray-500 mb-1.5">Alasan perlu diedit</label>
          <textarea
            value={requestEditNote}
            onChange={(e) => setRequestEditNote(e.target.value)}
            placeholder="Contoh: Ada perubahan nilai kontrak..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRequestEdit}
            disabled={requestLoading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
            {requestLoading ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>
          <button
            onClick={() => { setShowRequestEditModal(false); setRequestEditNote('') }}
            className="px-4 py-2.5 rounded-xl text-sm text-gray-400 transition"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}
    </div >
  )
}