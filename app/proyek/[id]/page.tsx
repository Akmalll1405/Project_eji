'use client'

import { useState, useEffect, useRef, cache } from 'react'
import { useSession } from 'next-auth/react'
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
  isApproved?: boolean
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
  catatanAdmin?: string
  statusApproval?: string
  approvedByName?: string
  approvedAt?: string
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

const inputStyle = (disabled = false): React.CSSProperties => ({
  background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: disabled ? '#6b7280' : '#fff',
  fontSize: '16px',
  minHeight: '44px',
  cursor: disabled ? 'not-allowed' : 'text',
  WebkitAppearance: 'none',
})

const ModalWrapper = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    style={{ background: 'rgba(0,0,0,0.75)', WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
  >
    {children}
  </div>
)

const ModalContent = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => (
  <div
    className={`w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} rounded-t-3xl sm:rounded-2xl overflow-y-auto`}
    style={{
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.08)',
      maxHeight: '92dvh',
      paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
      WebkitOverflowScrolling: 'touch',
    } as React.CSSProperties}
  >
    {children}
  </div>
)

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
  const [isProjectLocked, setIsProjectLocked] = useState(false)

  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [activeSection, setActiveSection] = useState('proyek')

  const [showRequestEditModal, setShowRequestEditModal] = useState(false)
  const [requestEditNote, setRequestEditNote] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)

  const [showRequestApprovalModal, setShowRequestApprovalModal] = useState(false)
  const [requestApprovalNote, setRequestApprovalNote] = useState('')
  const [requestApprovalLoading, setRequestApprovalLoading] = useState(false)

  const [showProjectApprovalModal, setShowProjectApprovalModal] = useState(false)
  const [projectApprovalLoading, setProjectApprovalLoading] = useState(false)
  const [catatanApprovalProyek, setCatatanApprovalProyek] = useState('')

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

  const [showTransaksiApprovalModal, setShowTransaksiApprovalModal] = useState(false)
  const [selectedTransaksi, setSelectedTransaksi] = useState<Transaksi | null>(null)
  const [catatanAdminTransaksi, setCatatanAdminTransaksi] = useState('')
  const [transaksiApprovalLoading, setTransaksiApprovalLoading] = useState(false)

  const [donorForm, setDonorForm] = useState({
    nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: ''
  })
  const [kegiatanForm, setKegiatanForm] = useState({
    namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: ''
  })
  const [editProyekForm, setEditProyekForm] = useState({
    nama: '', jenis: '', nilai: '', penanggungjawab: '', wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: ''
  })
  const [transaksiForm, setTransaksiForm] = useState<TransaksiForm>({
    namaProgram: '', kegiatan: '', staffCA: '',
    tanggalPengajuan: '', tanggalPertanggungjawaban: '',
    kelengkapanDokumen: 'Lengkap', jumlah: '0',
    statusTransaksi: 'Transfer successful', keterangan: '',
    jenisPembayaran: 'TUNAI', nomorRekening: '', bankTujuan: '',
    tanggalPembayaran: '', buktiBayarUrl: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated') fetchAll()
  }, [status])

  const fetchAll = async () => {
    try {
      const res = await fetch(`/api/proyek/${id}`, {
        cache: 'no-cache',
        next: { revalidate: 0 }
      })
      if (!res.ok) throw new Error('Gagal memuat data proyek')

      const data = await res.json()
      const p = Array.isArray(data) ? data[0] : data

      setProyek(p)
      setIsLocked(p.isApproved === true)
      setIsOwner((session?.user as any)?.role === 'ADMIN' || p.userId === (session?.user as any)?.id)

      setEditProyekForm({
        nama: p.nama || '',
        jenis: p.jenis || '',
        nilai: p.nilai?.toString() || '',
        penanggungjawab: p.penanggungjawab || '',
        wilayah: p.wilayah || '',
        sektor: p.sektor || '',
        tanggalMulai: p.tanggalMulai?.split('T')[0] || '',
        tanggalSelesai: p.tanggalSelesai?.split('T')[0] || '',
        status: p.status || 'PERENCANAAN'
      })

      await reloadAll()
      setLoading(false)
    } catch (error) {
      console.error('Fetch project error:', error)
      alert('Gagal memuat data proyek')
      setLoading(false)
    }
  }

  const reloadAll = async () => {
    try {
      const [d, dok, t, k] = await Promise.all([
        fetch(`/api/donor?projectId=${id}`, { cache: 'no-cache' }).then(r => r.json()),
        fetch(`/api/dokumen?projectId=${id}`, { cache: 'no-cache' }).then(r => r.json()),
        fetch(`/api/transaksi?projectId=${id}`, { cache: 'no-cache' }).then(r => r.json()),
        fetch(`/api/kegiatan?projectId=${id}`, { cache: 'no-cache' }).then(r => r.json()),
      ])

      setDonors(Array.isArray(d) ? d : [])
      setDokumen(Array.isArray(dok) ? dok : [])
      setTransaksi(Array.isArray(t) ? t : [])
      setKegiatan(Array.isArray(k) ? k : [])
    } catch (error) {
      console.error('Reload data error:', error)
    }
  }

  const handleApproveProject = async () => {
    setProjectApprovalLoading(true)
    try {
      const res = await fetch(`/api/proyek/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catatan: catatanApprovalProyek }),
        cache: 'no-cache'
      })

      if (!res.ok) throw new Error('Gagal')
      alert('✓ Proyek disetujui dan dikunci!')
      setShowProjectApprovalModal(false)
      setCatatanApprovalProyek('')
      fetchAll()
    } catch { alert('Gagal menyetujui proyek') }
    finally { setProjectApprovalLoading(false) }
  }

  const handleRejectProject = async () => {
    if (!confirm('Yakin batalkan persetujuan proyek ini?')) return
    setProjectApprovalLoading(true)
    try {
      await fetch(`/api/proyek/${id}/reject`, { method: 'POST' })
      alert('Persetujuan proyek dibatalkan')
      setShowProjectApprovalModal(false)
      fetchAll()
    } catch { alert('Gagal') }
    finally { setProjectApprovalLoading(false) }
  }

  const handleUnlockProject = async () => {
    if (!confirm('Buka kunci proyek ini untuk diedit?')) return
    try {
      await fetch(`/api/proyek/${id}/unlock`, { method: 'POST' })
      alert('✓ Proyek dibuka kuncinya')
      setShowProjectApprovalModal(false)
      fetchAll()
    } catch { alert('Gagal membuka kunci') }
  }
  const handleRequestApproval = async () => {
    setRequestApprovalLoading(true)
    try {
      // Kirim notif ke admin bahwa user minta project di-approve
      await fetch(`/api/proyek/${id}/request-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: requestApprovalNote || 'Mohon persetujuan proyek ini',
          type: 'REQUEST_APPROVAL'
        })
      })
      alert('✓ Permintaan persetujuan telah dikirim ke Admin!')
      setShowRequestApprovalModal(false)
      setRequestApprovalNote('')
    } catch { alert('Gagal mengirim permintaan') }
    finally { setRequestApprovalLoading(false) }
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
    } catch { alert('Gagal mengirim permintaan') }
    finally { setRequestLoading(false) }
  }

  const handleUpdateProyek = async () => {
    if (!editProyekForm.nama.trim()) { alert('Nama Program wajib diisi!'); return }
    if (!editProyekForm.jenis.trim()) { alert('Deskripsi Program wajib diisi!'); return }
    if (!editProyekForm.sektor.trim()) { alert('Sektor wajib diisi!'); return }
    if (!editProyekForm.tanggalMulai) { alert('Tanggal Mulai wajib diisi!'); return }
    await fetch(`/api/proyek/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editProyekForm)
    })
    alert('Data proyek berhasil diupdate!')
  }

  const handleSaveDonor = async () => {
    if (editDonor) {
      await fetch(`/api/donor/${editDonor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(donorForm) })
    } else {
      await fetch('/api/donor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...donorForm, projectId: id }) })
    }
    setShowDonorForm(false); setEditDonor(null)
    setDonorForm({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' })
    reloadAll()
  }

  const handleDeleteDonor = async (donorId: string) => {
    if (!confirm('Yakin hapus donor ini?')) return
    await fetch(`/api/donor/${donorId}`, { method: 'DELETE' })
    reloadAll()
  }

  const handleUploadDokumen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return

    if (isProjectLocked) {
      alert('Proyek sudah disetujui dan dikunci. Ajukan permintaan edit ke Admin untuk bisa upload dokumen.')
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) { alert('Format file harus PDF, JPG, atau PNG!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }
    setUploading(true)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const formData = new FormData()
        formData.append('file', file); formData.append('projectId', id); formData.append('bucket', 'dokumen')
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload gagal')
        await fetch('/api/dokumen', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jenisDokumen: selectedJenisDokumen, fileUrl: uploadData.fileUrl, fileName: uploadData.fileName, projectId: id })
        })
        reloadAll(); alert('Dokumen berhasil diupload!'); break
      } catch (error: any) {
        if (attempt >= 3) alert(`Gagal upload: ${error.message}`)
        else await new Promise(r => setTimeout(r, 1500))
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUploadBuktiBayar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingBukti(true)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const formData = new FormData()
        formData.append('file', file); formData.append('projectId', id); formData.append('bucket', 'bukti-bayar')
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error)
        setTransaksiForm(prev => ({ ...prev, buktiBayarUrl: uploadData.fileUrl }))
        alert('Bukti bayar berhasil diupload!'); break
      } catch (error: any) {
        if (attempt >= 3) alert(`Gagal: ${error.message}`)
        else await new Promise(r => setTimeout(r, 1500))
      }
    }
    setUploadingBukti(false)
  }

  const handleUploadFotoKegiatan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingFoto(true)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const formData = new FormData()
        formData.append('file', file); formData.append('projectId', id); formData.append('bucket', 'kegiatan')
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error)
        setKegiatanForm(prev => ({ ...prev, fotoUrl: uploadData.fileUrl, fotoName: uploadData.fileName }))
        alert('Foto berhasil diupload!'); break
      } catch (error: any) {
        if (attempt >= 3) alert(`Gagal: ${error.message}`)
        else await new Promise(r => setTimeout(r, 1500))
      }
    }
    setUploadingFoto(false)
  }

  const handleDeleteDokumen = async (dokumenId: string, fileUrl: string) => {
    if (!confirm('Yakin hapus dokumen ini?')) return
    const fileName = fileUrl.split('/dokumen/')[1]
    if (fileName) await supabase.storage.from('dokumen').remove([fileName])
    await fetch(`/api/dokumen/${dokumenId}`, { method: 'DELETE' })
    reloadAll()
  }

  const handleApprovalDokumen = async (approvalStatus: 'APPROVED' | 'REJECTED') => {
    if (!selectedDokumen) return
    setApprovalLoading(true)
    try {
      const res = await fetch(`/api/dokumen/${selectedDokumen.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: approvalStatus, catatanAdmin })
      })
      if (!res.ok) throw new Error('Gagal')
      setShowApprovalModal(false); setSelectedDokumen(null); setCatatanAdmin('')
      reloadAll()
      alert(approvalStatus === 'APPROVED' ? '✓ Dokumen disetujui!' : '✗ Dokumen ditolak!')
    } catch (error) { alert('Gagal: ' + String(error)) }
    finally { setApprovalLoading(false) }
  }

  const resetTransaksiForm = () => {
    setTransaksiForm({
      namaProgram: '', kegiatan: '', staffCA: '',
      tanggalPengajuan: '', tanggalPertanggungjawaban: '',
      kelengkapanDokumen: 'Lengkap', jumlah: '0',
      statusTransaksi: 'Transfer successful', keterangan: '',
      jenisPembayaran: 'TUNAI', nomorRekening: '', bankTujuan: '',
      tanggalPembayaran: '', buktiBayarUrl: ''
    })
    if (buktiBayarRef.current) buktiBayarRef.current.value = ''
  }

  const handleSaveTransaksi = async () => {
    if (!transaksiForm.namaProgram.trim()) { alert('Nama Program wajib diisi!'); return }
    if (!transaksiForm.staffCA.trim()) { alert('Staff CA wajib diisi!'); return }
    if (!transaksiForm.tanggalPengajuan) { alert('Tanggal Pengajuan wajib diisi!'); return }
    const payload = { ...transaksiForm, projectId: id, jumlah: parseFloat(transaksiForm.jumlah) || 0, tanggalPembayaran: transaksiForm.tanggalPengajuan }
    if (editTransaksi) {
      await fetch(`/api/transaksi/${editTransaksi.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/transaksi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm(); reloadAll()
  }

  const handleDeleteTransaksi = async (tId: string) => {
    if (!confirm('Yakin hapus transaksi ini?')) return
    await fetch(`/api/transaksi/${tId}`, { method: 'DELETE' }); reloadAll()
  }

  const handleTransaksiApproval = async (approvalStatus: 'CLEAR' | 'NOT_CLEAR') => {
    if (!selectedTransaksi) return
    setTransaksiApprovalLoading(true)
    try {
      const res = await fetch(`/api/transaksi/${selectedTransaksi.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusApproval: approvalStatus, catatanAdmin: catatanAdminTransaksi })
      })
      if (!res.ok) throw new Error('Gagal')
      setShowTransaksiApprovalModal(false); setSelectedTransaksi(null); setCatatanAdminTransaksi('')
      reloadAll()
      alert(approvalStatus === 'CLEAR' ? '✓ Transaksi Clear!' : '✗ Transaksi Not Clear!')
    } catch (error) { alert('Gagal: ' + String(error)) }
    finally { setTransaksiApprovalLoading(false) }
  }

  const handleSaveKegiatan = async () => {
    if (!kegiatanForm.namaKegiatan || !kegiatanForm.tanggalKegiatan) { alert('Nama kegiatan dan tanggal wajib diisi!'); return }
    if (editKegiatan) {
      await fetch(`/api/kegiatan/${editKegiatan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kegiatanForm) })
    } else {
      await fetch('/api/kegiatan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...kegiatanForm, projectId: id }) })
    }
    setShowKegiatanForm(false); setEditKegiatan(null)
    setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }); reloadAll()
  }

  const handleDeleteKegiatan = async (kegiatanId: string) => {
    if (!confirm('Yakin hapus kegiatan ini?')) return
    await fetch(`/api/kegiatan/${kegiatanId}`, { method: 'DELETE' }); reloadAll()
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num)

  const jenisDokumenLabel: Record<string, string> = {
    PROPOSAL: 'Proposal', KONTRAK_KERJA: 'Kontrak Kerja', SURAT_IZIN: 'Surat Izin',
    DOKUMENTASI_KEGIATAN: 'Dokumentasi Kegiatan', LAPORAN_AKHIR: 'Laporan Akhir',
    SURAT_REKOMENDASI: 'Surat Rekomendasi', LAPORAN_PERIODIK: 'Laporan Periodik',
    LAIN_LAIN: 'Lain-lain'
  }

  const statusLabel: Record<string, string> = { PERENCANAAN: 'Draft', BERJALAN: 'Sedang Diproses', SELESAI: 'Selesai' }

  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const canEdit = isOwner && (!isLocked || isAdmin)

  const lockBanner = (() => {
    if (isAdmin) return null
    if (isLocked && isOwner) return (
      <div className="mb-4 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
        <div className="text-sm font-medium text-yellow-400 mb-1">🔒 Proyek Terkunci</div>
        <div className="text-xs text-gray-500">Proyek telah disetujui Admin. Ajukan izin edit jika perlu perubahan.</div>
      </div>
    )
    if (!isOwner) return (
      <div className="mb-4 px-4 py-3 rounded-xl text-xs"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
        ⚠ Kamu hanya bisa melihat data proyek ini
      </div>
    )
    return null
  })()

  if (loading) return <Loading />

  return (
    <div style={{ minHeight: '100dvh', background: '#030712' }}>
      <Header />
      <main className="py-4 sm:py-6 max-w-5xl mx-auto"
        style={{
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
        }}>
        <button onClick={() => router.push('/dashboard')}
          className="text-blue-400 text-sm mb-4 hover:text-blue-300 transition flex items-center gap-1"
          style={{ minHeight: '44px' }}>
          ← Dashboard
        </button>

        {/* Info Proyek */}
        <div className="rounded-xl p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-base truncate">{proyek?.nama}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-gray-500 text-xs">{proyek?.jenis}</span>
                {proyek?.wilayah && (
                  <><span className="text-gray-700">•</span>
                    <span className="text-gray-500 text-xs">{proyek.wilayah}</span></>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${proyek?.status === 'BERJALAN' ? 'bg-blue-500/10 text-blue-400' :
                  proyek?.status === 'SELESAI' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-gray-500/10 text-gray-400'}`}>
                  {statusLabel[proyek?.status || '']}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isLocked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {isLocked ? '✓ Disetujui' : '⏳ Menunggu Persetujuan'}
                </span>
              </div>
            </div>

            {/* Tombol Admin: Setujui / Kelola */}
            {isAdmin && (
              <button onClick={() => setShowProjectApprovalModal(true)}
                className="px-3 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0"
                style={{
                  background: isLocked ? 'rgba(52,211,153,0.15)' : 'rgba(234,179,8,0.15)',
                  border: isLocked ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(234,179,8,0.3)',
                  color: isLocked ? '#34d399' : '#facc15', minHeight: '44px',
                }}>
                {isLocked ? 'Kelola' : 'Setujui'}
              </button>
            )}

            {/* Tombol User */}
            {!isAdmin && isOwner && (
              <>
                {!isLocked ? (
                  <button onClick={() => setShowRequestApprovalModal(true)}
                    className="px-3 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0"
                    style={{
                      background: 'rgba(37,99,235,0.15)',
                      border: '1px solid rgba(37,99,235,0.3)',
                      color: '#60a5fa', minHeight: '44px',
                    }}>
                    Ajukan Persetujuan
                  </button>
                ) : (

                  <button onClick={() => setShowRequestEditModal(true)}
                    className="px-3 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0"
                    style={{
                      background: 'rgba(234,179,8,0.15)',
                      border: '1px solid rgba(234,179,8,0.3)',
                      color: '#facc15', minHeight: '44px',
                    }}>
                    Ajukan Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 pb-1"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as React.CSSProperties}>
          {[
            { key: 'proyek', label: 'Data Proyek' }, { key: 'donor', label: 'Pendonor' },
            { key: 'dokumen', label: 'Dokumen' }, { key: 'keuangan', label: 'Keuangan' },
            { key: 'lainlain', label: 'Lain-Lain' },
          ].map((s) => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className="px-4 text-xs font-medium transition whitespace-nowrap rounded-t-lg"
              style={{ color: activeSection === s.key ? '#60a5fa' : '#6b7280', borderBottom: activeSection === s.key ? '2px solid #2563eb' : '2px solid transparent', background: activeSection === s.key ? 'rgba(37,99,235,0.05)' : 'transparent', minHeight: '44px' }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* TAB: DATA PROYEK */}
        {activeSection === 'proyek' && (
          <div>
            <div className="px-4 py-2.5 rounded-xl font-bold text-xs mb-4 text-white uppercase tracking-wider"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>DATA PROJEK</div>
            {lockBanner}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Deskripsi Program', key: 'jenis' }, { label: 'Nama Program', key: 'nama' },
                { label: 'Nilai Kontrak (Rp)', key: 'nilai' }, { label: 'Program Manager', key: 'penanggungjawab' },
                { label: 'Wilayah Pengerjaan', key: 'wilayah' }, { label: 'Sektor', key: 'sektor' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1.5">{label}</label>
                  <input type={key === 'nilai' ? 'number' : 'text'}
                    value={editProyekForm[key as keyof typeof editProyekForm]}
                    onChange={(e) => setEditProyekForm({ ...editProyekForm, [key]: e.target.value })}
                    disabled={!canEdit}
                    className="w-full px-3.5 rounded-xl outline-none transition"
                    style={inputStyle(!canEdit)} />
                </div>
              ))}
              {[{ label: 'Tanggal Mulai', key: 'tanggalMulai' }, { label: 'Tanggal Selesai', key: 'tanggalSelesai' }].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1.5">{label}</label>
                  <input type="date" value={editProyekForm[key as keyof typeof editProyekForm]}
                    onChange={(e) => setEditProyekForm({ ...editProyekForm, [key]: e.target.value })}
                    disabled={!canEdit} className="w-full px-3.5 rounded-xl outline-none"
                    style={{ ...inputStyle(!canEdit), colorScheme: 'dark' } as React.CSSProperties} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Status</label>
                <select value={editProyekForm.status}
                  onChange={(e) => setEditProyekForm({ ...editProyekForm, status: e.target.value })}
                  disabled={!canEdit} className="w-full px-3.5 rounded-xl outline-none"
                  style={{ ...inputStyle(!canEdit), colorScheme: 'dark' } as React.CSSProperties}>
                  <option value="PERENCANAAN" className="bg-gray-900">Draft</option>
                  <option value="BERJALAN" className="bg-gray-900">Sedang Diproses</option>
                  <option value="SELESAI" className="bg-gray-900">Selesai</option>
                </select>
              </div>
            </div>
            {canEdit && (
              <button onClick={handleUpdateProyek}
                className="mt-5 px-6 rounded-xl text-white text-sm font-medium transition"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', minHeight: '44px' }}>
                Simpan Perubahan
              </button>
            )}
          </div>
        )}

        {/* TAB: PENDONOR */}
        {activeSection === 'donor' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>DATA PENDONOR</div>
              {canEdit && (
                <button onClick={() => { setShowDonorForm(true); setEditDonor(null); setDonorForm({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' }) }}
                  className="px-3 rounded-xl text-white text-xs font-medium whitespace-nowrap"
                  style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', minHeight: '44px' }}>
                  + Tambah
                </button>
              )}
            </div>
            {lockBanner}
            {donors.length === 0 ? <p className="text-gray-600 text-sm text-center py-10">Belum ada data pendonor</p>
              : donors.map((d) => (
                <div key={d.id} className="rounded-xl mb-3 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-4 py-2.5 font-semibold text-sm text-white"
                    style={{ background: 'rgba(20,184,166,0.15)', borderBottom: '1px solid rgba(20,184,166,0.2)' }}>{d.nama}</div>
                  <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-sm text-gray-400 mb-2">{d.alamat}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>Tahun Pendirian: <span className="text-gray-400">{d.tahunPendirian}</span></div>
                      <div>Lama Usaha: <span className="text-gray-400">{d.lamaUsaha} tahun</span></div>
                    </div>
                    <div className="mt-2 text-xs">
                      <div className="text-gray-600 mt-2 mb-1 uppercase tracking-wider">Pengurus</div>
                      <div className="text-gray-400">PJ: <span className="text-gray-300 font-medium">{d.penanggungjawab}</span></div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => { setEditDonor(d); setDonorForm({ nama: d.nama, jenis: d.jenis, penanggungjawab: d.penanggungjawab, wilayah: d.wilayah, alamat: d.alamat, tahunPendirian: d.tahunPendirian?.toString(), lamaUsaha: d.lamaUsaha?.toString() }); setShowDonorForm(true) }}
                          className="text-blue-400 text-xs hover:text-blue-300 transition" style={{ minHeight: '44px' }}>Edit</button>
                        <button onClick={() => handleDeleteDonor(d.id)}
                          className="text-red-400 text-xs hover:text-red-300 transition" style={{ minHeight: '44px' }}>Hapus</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* TAB: DOKUMEN */}
        {activeSection === 'dokumen' && (
          <div>
            <div className="px-4 py-2.5 rounded-xl font-bold text-xs mb-4 text-white uppercase tracking-wider"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>UPLOAD DOKUMEN</div>
            {lockBanner}

            {isOwner && (!isLocked || isAdmin) && (
              <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">Jenis Dokumen</label>
                    <select value={selectedJenisDokumen} onChange={(e) => setSelectedJenisDokumen(e.target.value)}
                      className="w-full px-3.5 rounded-xl text-white outline-none"
                      style={{ ...inputStyle(), colorScheme: 'dark' } as React.CSSProperties}>
                      <option value="KONTRAK_KERJA" className="bg-gray-900">Kontrak Kerja</option>
                      <option value="PROPOSAL" className="bg-gray-900">Proposal</option>
                      <option value="SURAT_IZIN" className="bg-gray-900">Surat Izin</option>
                      <option value="DOKUMENTASI_KEGIATAN" className="bg-gray-900">Dokumentasi Kegiatan</option>
                      <option value="LAPORAN_AKHIR" className="bg-gray-900">Laporan Akhir</option>
                      <option value="SURAT_REKOMENDASI" className="bg-gray-900">Surat Rekomendasi</option>
                      <option value="LAPORAN_PERIODIK" className="bg-gray-900">Laporan Periodik</option>
                      <option value="LAIN_LAIN" className="bg-gray-900">Lain-lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1.5">File</label>
                    <div className="rounded-xl p-4 text-center transition"
                      style={{ border: uploading ? '2px dashed rgba(37,99,235,0.4)' : '2px dashed rgba(255,255,255,0.1)', background: uploading ? 'rgba(37,99,235,0.05)' : 'rgba(255,255,255,0.02)' }}>
                      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleUploadDokumen} className="hidden" id="fileUpload" />
                      <label htmlFor="fileUpload" className="cursor-pointer block py-1">
                        <div className="text-2xl mb-1">{uploading ? '⏳' : '📎'}</div>
                        <div className="text-xs text-gray-500">{uploading ? 'Mengupload...' : isProjectLocked ? '🔒 Upload dinonaktifkan' : 'Klik untuk upload'} </div>
                        <div className="text-xs text-gray-700 mt-1">PDF, JPG, PNG (maks 10MB)</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isLocked && !isAdmin && isOwner && (
              <div className="mb-4 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
                <div className="text-xs text-yellow-600">
                  🔒 Upload dokumen tidak tersedia selama proyek terkunci. Ajukan pengeditan terlebih dahulu.
                </div>
              </div>
            )}
            <div className="flex gap-3 mb-4 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">⏳ Menunggu</span>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">✓ Disetujui</span>
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">✗ Ditolak</span>
            </div>
            
            {dokumen.length === 0 ? <p className="text-gray-600 text-sm text-center py-10">Belum ada dokumen</p>
              : (
                <div className="space-y-3">
                  {dokumen.map((d) => (
                    <div key={d.id} className="rounded-xl p-4"
                      style={{ background: 'rgba(255,255,255,0.02)', border: d.status === 'APPROVED' ? '1px solid rgba(52,211,153,0.2)' : d.status === 'REJECTED' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-200 font-medium truncate">{d.fileName}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{jenisDokumenLabel[d.jenisDokumen]} • {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}</div>
                          <div className="mt-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${d.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : d.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {d.status === 'APPROVED' ? '✓ Disetujui' : d.status === 'REJECTED' ? '✗ Ditolak' : '⏳ Menunggu'}
                            </span>
                          </div>
                          {d.catatanAdmin && (
                            <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-gray-500">Catatan: </span><span className="text-gray-300 italic">"{d.catatanAdmin}"</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 text-xs hover:text-blue-300 transition" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>Download</a>

                          {isLocked && !isAdmin && isOwner && (
                            <button onClick={() => { setSelectedDokumen(d); setCatatanAdmin(d.catatanAdmin || ''); setShowApprovalModal(true) }}
                              className="text-xs px-3 rounded-lg transition whitespace-nowrap"
                              style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#facc15', minHeight: '44px' }}>
                              Review
                            </button>
                          )}
                          {isOwner && d.status !== 'APPROVED' && (
                            <button onClick={() => handleDeleteDokumen(d.id, d.fileUrl)}
                              className="text-red-400 text-xs hover:text-red-300 transition" style={{ minHeight: '44px' }}>Hapus</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* TAB: KEUANGAN */}
        {activeSection === 'keuangan' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>KEUANGAN</div>
              {canEdit && (
                <button onClick={() => { setShowTransaksiForm(true); setEditTransaksi(null); resetTransaksiForm() }}
                  className="px-3 rounded-xl text-white text-xs font-medium whitespace-nowrap"
                  style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', minHeight: '44px' }}>
                  + Pembayaran
                </button>
              )}
            </div>
            {lockBanner}
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Clear</span>
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">✗ Not Clear</span>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">⏳ Pending</span>
            </div>
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div className="text-xs text-gray-600">Total Pembayaran</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{formatRupiah(transaksi.reduce((acc, t) => acc + t.jumlah, 0))}</div>
            </div>
            {transaksi.length === 0 ? <p className="text-gray-600 text-sm text-center py-10">Belum ada data keuangan</p>
              : transaksi.map((t) => {
                const approvalSt = (t.statusApproval || 'PENDING').toUpperCase()
                const isClear = approvalSt === 'CLEAR'
                const isNotClear = approvalSt === 'NOT_CLEAR'
                return (
                  <div key={t.id} className="rounded-xl p-4 mb-3"
                    style={{ background: 'rgba(255,255,255,0.02)', border: isClear ? '1px solid rgba(52,211,153,0.2)' : isNotClear ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-200 truncate">{t.namaProgram || t.keterangan || '-'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.statusTransaksi === 'Transfer successful' ? 'bg-emerald-500/10 text-emerald-400' : t.statusTransaksi === 'Settlement' ? 'bg-blue-500/10 text-blue-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {t.statusTransaksi || t.jenisPembayaran}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-block ${isClear ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isNotClear ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                            {isClear ? '✓ Clear' : isNotClear ? '✗ Not Clear' : '⏳ Pending Review'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                          {t.kegiatan && <div><span className="text-gray-600">Kegiatan: </span><span className="text-gray-300">{t.kegiatan}</span></div>}
                          {t.staffCA && <div><span className="text-gray-600">Staff CA: </span><span className="text-gray-300">{t.staffCA}</span></div>}
                          {t.tanggalPengajuan && <div><span className="text-gray-600">Tgl: </span><span className="text-gray-300">{new Date(t.tanggalPengajuan).toLocaleDateString('id-ID')}</span></div>}
                          {t.kelengkapanDokumen && <div><span className="text-gray-600">Dok: </span><span className={t.kelengkapanDokumen === 'Lengkap' ? 'text-emerald-400' : 'text-orange-400'}>{t.kelengkapanDokumen}</span></div>}
                          <div><span className="text-gray-600">Nominal: </span><span className="text-emerald-400 font-medium">{formatRupiah(t.jumlah)}</span></div>
                        </div>
                        {t.buktiBayarUrl && <a href={t.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:text-blue-300 transition mt-2 inline-block">Lihat Bukti →</a>}
                        {t.catatanAdmin && (
                          <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-gray-500">Catatan Admin: </span><span className="text-gray-300 italic">"{t.catatanAdmin}"</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {isAdmin && (
                          <button onClick={() => { setSelectedTransaksi(t); setCatatanAdminTransaksi(t.catatanAdmin || ''); setShowTransaksiApprovalModal(true) }}
                            className="text-xs px-3 rounded-lg transition whitespace-nowrap"
                            style={{ background: isClear ? 'rgba(52,211,153,0.15)' : isNotClear ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', border: isClear ? '1px solid rgba(52,211,153,0.3)' : isNotClear ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(234,179,8,0.3)', color: isClear ? '#34d399' : isNotClear ? '#f87171' : '#facc15', minHeight: '44px' }}>
                            {isClear || isNotClear ? 'Ubah' : 'Review'}
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button onClick={() => {
                              setEditTransaksi(t)
                              setTransaksiForm({ namaProgram: t.namaProgram || '', kegiatan: t.kegiatan || '', staffCA: t.staffCA || '', tanggalPengajuan: t.tanggalPengajuan?.split('T')[0] || '', tanggalPertanggungjawaban: t.tanggalPertanggungjawaban?.split('T')[0] || '', kelengkapanDokumen: t.kelengkapanDokumen || 'Lengkap', jumlah: t.jumlah.toString(), statusTransaksi: t.statusTransaksi || 'Transfer successful', keterangan: t.keterangan || '', jenisPembayaran: t.jenisPembayaran || 'TUNAI', nomorRekening: t.nomorRekening || '', bankTujuan: t.bankTujuan || '', tanggalPembayaran: t.tanggalPembayaran?.split('T')[0] || '', buktiBayarUrl: t.buktiBayarUrl || '' })
                              setShowTransaksiForm(true)
                            }} className="text-blue-400 text-xs hover:text-blue-300 transition" style={{ minHeight: '44px' }}>Edit</button>
                            <button onClick={() => handleDeleteTransaksi(t.id)} className="text-red-400 text-xs hover:text-red-300 transition" style={{ minHeight: '44px' }}>Hapus</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* TAB: LAIN-LAIN */}
        {activeSection === 'lainlain' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="px-4 py-2.5 rounded-xl font-bold text-xs text-white uppercase tracking-wider flex-1 mr-3"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>LAIN-LAIN</div>
              {canEdit && (
                <button onClick={() => { setShowKegiatanForm(true); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }}
                  className="px-3 rounded-xl text-white text-xs font-medium whitespace-nowrap"
                  style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', minHeight: '44px' }}>
                  + Kegiatan
                </button>
              )}
            </div>
            {lockBanner}
            {kegiatan.length === 0 ? <p className="text-gray-600 text-sm text-center py-10">Belum ada kegiatan</p>
              : (
                <div className="space-y-3">
                  {kegiatan.map((k) => (
                    <div key={k.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-200 text-sm">{k.namaKegiatan}</div>
                          <div className="text-xs text-gray-600 mt-1">{new Date(k.tanggalKegiatan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                          {k.fotoUrl && (
                            <div className="mt-3">
                              <img src={k.fotoUrl} alt={k.namaKegiatan} className="w-40 h-28 object-cover rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                              <a href={k.fotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:text-blue-300 transition mt-1 block">Lihat lengkap →</a>
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-3 ml-4">
                            <button onClick={() => { setEditKegiatan(k); setKegiatanForm({ namaKegiatan: k.namaKegiatan, tanggalKegiatan: k.tanggalKegiatan.split('T')[0], fotoUrl: k.fotoUrl || '', fotoName: k.fotoName || '' }); setShowKegiatanForm(true) }}
                              className="text-blue-400 text-xs hover:text-blue-300 transition" style={{ minHeight: '44px' }}>Edit</button>
                            <button onClick={() => handleDeleteKegiatan(k.id)} className="text-red-400 text-xs hover:text-red-300 transition" style={{ minHeight: '44px' }}>Hapus</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </main>

      {/* ══ SEMUA MODAL ══ */}

      {/* Modal Project Approval */}
      {showProjectApprovalModal && (
        <ModalWrapper onClose={() => { setShowProjectApprovalModal(false); setCatatanApprovalProyek('') }}>
          <ModalContent>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-1">Persetujuan Proyek</h3>
              <p className="text-sm text-gray-500 mb-3 truncate">{proyek?.nama}</p>
              <div className="mb-4 px-3 py-2 rounded-lg" style={{ background: isLocked ? 'rgba(52,211,153,0.06)' : 'rgba(234,179,8,0.06)', border: isLocked ? '1px solid rgba(52,211,153,0.15)' : '1px solid rgba(234,179,8,0.15)' }}>
                <span className="text-xs text-gray-500">Status: </span>
                <span className={`text-xs font-medium ${isLocked ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {isLocked ? '✓ Sudah Disetujui & Terkunci' : '⏳ Belum Disetujui'}
                </span>
              </div>
              {!isLocked ? (
                <>
                  <div className="mb-5">
                    <label className="block text-xs text-gray-500 mb-1.5">Catatan (opsional)</label>
                    <textarea value={catatanApprovalProyek} onChange={(e) => setCatatanApprovalProyek(e.target.value)}
                      placeholder="Contoh: Proyek sudah memenuhi syarat..."
                      rows={3} className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '16px' }} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleApproveProject} disabled={projectApprovalLoading}
                      className="flex-1 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', minHeight: '48px' }}>
                      {projectApprovalLoading ? '...' : '✓ Setujui & Kunci'}
                    </button>
                    <button onClick={() => { setShowProjectApprovalModal(false); setCatatanApprovalProyek('') }}
                      className="px-4 rounded-xl text-sm text-gray-500"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>
                      Batal
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-5">Proyek terkunci. Buka kunci agar user bisa edit, atau batalkan persetujuan.</p>
                  <div className="flex gap-3">
                    <button onClick={handleUnlockProject} disabled={projectApprovalLoading}
                      className="flex-1 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.35)', color: '#60a5fa', minHeight: '48px' }}>
                      🔓 Buka Kunci
                    </button>
                    <button onClick={handleRejectProject} disabled={projectApprovalLoading}
                      className="flex-1 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', minHeight: '48px' }}>
                      ✗ Batalkan
                    </button>
                    <button onClick={() => setShowProjectApprovalModal(false)}
                      className="px-4 rounded-xl text-sm text-gray-500"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>
                      Tutup
                    </button>
                  </div>
                </>
              )}
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Transaksi Approval */}
      {showTransaksiApprovalModal && selectedTransaksi && (
        <ModalWrapper onClose={() => { setShowTransaksiApprovalModal(false); setSelectedTransaksi(null); setCatatanAdminTransaksi('') }}>
          <ModalContent>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-1">Review Keuangan</h3>
              <p className="text-sm text-gray-500 mb-1 truncate">{selectedTransaksi.namaProgram || selectedTransaksi.keterangan || '-'}</p>
              <p className="text-xs text-gray-600 mb-4">Nominal: <span className="font-medium text-emerald-400">{formatRupiah(selectedTransaksi.jumlah)}</span></p>
              <div className="mb-4">
                <span className="text-xs text-gray-600">Status saat ini: </span>
                <span className={`text-xs font-medium ${selectedTransaksi.statusApproval === 'CLEAR' ? 'text-emerald-400' : selectedTransaksi.statusApproval === 'NOT_CLEAR' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {selectedTransaksi.statusApproval === 'CLEAR' ? '✓ Clear' : selectedTransaksi.statusApproval === 'NOT_CLEAR' ? '✗ Not Clear' : '⏳ Pending'}
                </span>
              </div>
              <div className="mb-5">
                <label className="block text-xs text-gray-500 mb-1.5">Catatan (opsional)</label>
                <textarea value={catatanAdminTransaksi} onChange={(e) => setCatatanAdminTransaksi(e.target.value)}
                  placeholder="Contoh: Bukti pembayaran sudah sesuai..." rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '16px' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleTransaksiApproval('CLEAR')} disabled={transaksiApprovalLoading}
                  className="flex-1 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', minHeight: '48px' }}>
                  {transaksiApprovalLoading ? '...' : '✓ Clear'}
                </button>
                <button onClick={() => handleTransaksiApproval('NOT_CLEAR')} disabled={transaksiApprovalLoading}
                  className="flex-1 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', minHeight: '48px' }}>
                  {transaksiApprovalLoading ? '...' : '✗ Not Clear'}
                </button>
                <button onClick={() => { setShowTransaksiApprovalModal(false); setSelectedTransaksi(null); setCatatanAdminTransaksi('') }} disabled={transaksiApprovalLoading}
                  className="px-4 rounded-xl text-sm text-gray-500 transition disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>
                  Batal
                </button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Donor */}
      {showDonorForm && (
        <ModalWrapper onClose={() => { setShowDonorForm(false); setEditDonor(null) }}>
          <ModalContent>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-5">{editDonor ? 'Edit Donor' : 'Tambah Donor'}</h3>
              <div className="space-y-3">
                {[{ label: 'Nama Yayasan/Lembaga', key: 'nama' }, { label: 'Alamat Lengkap', key: 'alamat' }, { label: 'Tahun Pendirian', key: 'tahunPendirian' }, { label: 'Lama Usaha (tahun)', key: 'lamaUsaha' }, { label: 'Penanggung Jawab', key: 'penanggungjawab' }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                    <input type={['tahunPendirian', 'lamaUsaha'].includes(key) ? 'number' : 'text'}
                      value={donorForm[key as keyof typeof donorForm]}
                      onChange={(e) => setDonorForm({ ...donorForm, [key]: e.target.value })}
                      className="w-full px-3.5 rounded-xl text-white outline-none" style={inputStyle()} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSaveDonor} className="flex-1 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', minHeight: '48px' }}>Simpan</button>
                <button onClick={() => { setShowDonorForm(false); setEditDonor(null) }} className="flex-1 rounded-xl text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>Batal</button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Transaksi */}
      {showTransaksiForm && (
        <ModalWrapper onClose={() => { setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm() }}>
          <ModalContent wide>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-5">{editTransaksi ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[{ label: 'Nama Program *', key: 'namaProgram' }, { label: 'Kegiatan', key: 'kegiatan' }, { label: 'Staff CA *', key: 'staffCA' }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                    <input type="text" placeholder="ketik..." value={transaksiForm[key as keyof TransaksiForm]}
                      onChange={(e) => setTransaksiForm({ ...transaksiForm, [key]: e.target.value })}
                      className="w-full px-3 rounded-lg text-white outline-none" style={inputStyle()} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {[{ label: 'Tanggal Pengajuan *', key: 'tanggalPengajuan' }, { label: 'Tanggal Pertanggungjawaban', key: 'tanggalPertanggungjawaban' }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                    <input type="date" value={transaksiForm[key as keyof TransaksiForm]}
                      onChange={(e) => setTransaksiForm({ ...transaksiForm, [key]: e.target.value })}
                      className="w-full px-3 rounded-lg text-white outline-none" style={{ ...inputStyle(), colorScheme: 'dark' } as React.CSSProperties} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Kelengkapan Dokumen</label>
                  <select value={transaksiForm.kelengkapanDokumen} onChange={(e) => setTransaksiForm({ ...transaksiForm, kelengkapanDokumen: e.target.value })}
                    className="w-full px-3 rounded-lg text-white outline-none" style={{ ...inputStyle(), colorScheme: 'dark' } as React.CSSProperties}>
                    <option value="Lengkap" className="bg-gray-900">Lengkap</option>
                    <option value="Kurang" className="bg-gray-900">Kurang</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Nominal Transaksi</label>
                  <input type="number" placeholder="0" value={transaksiForm.jumlah}
                    onChange={(e) => setTransaksiForm({ ...transaksiForm, jumlah: e.target.value })}
                    className="w-full px-3 rounded-lg text-white outline-none" style={inputStyle()} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Status</label>
                  <select value={transaksiForm.statusTransaksi} onChange={(e) => setTransaksiForm({ ...transaksiForm, statusTransaksi: e.target.value })}
                    className="w-full px-3 rounded-lg text-white outline-none" style={{ ...inputStyle(), colorScheme: 'dark' } as React.CSSProperties}>
                    <option value="Transfer successful" className="bg-gray-900">Transfer successful</option>
                    <option value="Settlement" className="bg-gray-900">Settlement</option>
                    <option value="clear" className="bg-gray-900">clear</option>
                    <option value="Pending" className="bg-gray-900">Pending</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1.5">Keterangan</label>
                <input type="text" placeholder="Keterangan tambahan..." value={transaksiForm.keterangan}
                  onChange={(e) => setTransaksiForm({ ...transaksiForm, keterangan: e.target.value })}
                  className="w-full px-3 rounded-lg text-white outline-none" style={inputStyle()} />
              </div>
              <div className="mb-5">
                <label className="block text-xs text-gray-500 mb-1.5">Bukti Pembayaran</label>
                <div className="rounded-xl p-3 text-center" style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <input ref={buktiBayarRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleUploadBuktiBayar} className="hidden" id="buktiBayarUpload" />
                  <label htmlFor="buktiBayarUpload" className="cursor-pointer block py-2">
                    <div className="text-lg mb-1">📎</div>
                    <div className="text-xs text-gray-500">{uploadingBukti ? 'Mengupload...' : 'Klik untuk upload'}</div>
                  </label>
                </div>
                {transaksiForm.buktiBayarUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓ Terupload</span>
                    <a href={transaksiForm.buktiBayarUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:text-blue-300">Lihat →</a>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveTransaksi} className="flex-1 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', minHeight: '48px' }}>Simpan</button>
                <button onClick={() => { setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm() }} className="flex-1 rounded-xl text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>Batal</button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Kegiatan */}
      {showKegiatanForm && (
        <ModalWrapper onClose={() => { setShowKegiatanForm(false); setEditKegiatan(null) }}>
          <ModalContent>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-5">{editKegiatan ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Nama Kegiatan *</label>
                  <input type="text" value={kegiatanForm.namaKegiatan}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, namaKegiatan: e.target.value })}
                    placeholder="Masukkan nama kegiatan" className="w-full px-3.5 rounded-xl text-white outline-none" style={inputStyle()} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Tanggal Kegiatan *</label>
                  <input type="date" value={kegiatanForm.tanggalKegiatan}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, tanggalKegiatan: e.target.value })}
                    className="w-full px-3.5 rounded-xl text-white outline-none" style={{ ...inputStyle(), colorScheme: 'dark' } as React.CSSProperties} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Foto Dokumentasi</label>
                  <div className="rounded-xl p-4 text-center" style={{ border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                    <input ref={fotoKegiatanRef} type="file" accept=".jpg,.jpeg,.png"
                      onChange={handleUploadFotoKegiatan} className="hidden" id="fotoKegiatanUpload" />
                    <label htmlFor="fotoKegiatanUpload" className="cursor-pointer block py-2">
                      <div className="text-xl mb-1">📷</div>
                      <div className="text-xs text-gray-500">{uploadingFoto ? 'Mengupload...' : 'Klik untuk upload foto'}</div>
                    </label>
                  </div>
                  {kegiatanForm.fotoUrl && (
                    <div className="mt-2">
                      <img src={kegiatanForm.fotoUrl} alt="Preview" className="w-full h-28 object-cover rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-emerald-400 text-xs">✓ Terupload</span>
                        <button onClick={() => setKegiatanForm({ ...kegiatanForm, fotoUrl: '', fotoName: '' })} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSaveKegiatan} className="flex-1 rounded-xl text-white text-sm font-medium" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', minHeight: '48px' }}>Simpan</button>
                <button onClick={() => { setShowKegiatanForm(false); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }} className="flex-1 rounded-xl text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>Batal</button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Approval Dokumen */}
      {showApprovalModal && selectedDokumen && (
        <ModalWrapper onClose={() => { setShowApprovalModal(false); setSelectedDokumen(null); setCatatanAdmin('') }}>
          <ModalContent>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-1">Review Dokumen</h3>
              <p className="text-sm text-gray-500 mb-1 truncate">{selectedDokumen.fileName}</p>
              <p className="text-xs text-gray-600 mb-4">{jenisDokumenLabel[selectedDokumen.jenisDokumen]}</p>
              <div className="mb-4">
                <span className="text-xs text-gray-600">Status saat ini: </span>
                <span className={`text-xs font-medium ${selectedDokumen.status === 'APPROVED' ? 'text-emerald-400' : selectedDokumen.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {selectedDokumen.status === 'APPROVED' ? 'Disetujui' : selectedDokumen.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                </span>
              </div>
              <div className="mb-5">
                <label className="block text-xs text-gray-500 mb-1.5">Catatan (opsional)</label>
                <textarea value={catatanAdmin} onChange={(e) => setCatatanAdmin(e.target.value)}
                  placeholder="Contoh: Dokumen sudah sesuai..." rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '16px' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleApprovalDokumen('APPROVED')} disabled={approvalLoading}
                  className="flex-1 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', minHeight: '48px' }}>
                  {approvalLoading ? '...' : '✓ Setujui'}
                </button>
                <button onClick={() => handleApprovalDokumen('REJECTED')} disabled={approvalLoading}
                  className="flex-1 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', minHeight: '48px' }}>
                  {approvalLoading ? '...' : '✗ Tolak'}
                </button>
                <button onClick={() => { setShowApprovalModal(false); setSelectedDokumen(null); setCatatanAdmin('') }} disabled={approvalLoading}
                  className="px-4 rounded-xl text-sm text-gray-500 transition disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>
                  Batal
                </button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Request Edit */}
      {showRequestEditModal && (
        <ModalWrapper onClose={() => { setShowRequestEditModal(false); setRequestEditNote('') }}>
          <ModalContent>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-1">Ajukan Permintaan Edit</h3>
              <p className="text-xs text-gray-500 mb-5">Permintaan akan dikirim ke Admin untuk disetujui.</p>
              <div className="mb-5">
                <label className="block text-xs text-gray-500 mb-1.5">Alasan perlu diedit</label>
                <textarea value={requestEditNote} onChange={(e) => setRequestEditNote(e.target.value)}
                  placeholder="Contoh: Ada perubahan nilai kontrak..." rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '16px' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleRequestEdit} disabled={requestLoading}
                  className="flex-1 rounded-xl text-white text-sm font-medium transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', minHeight: '48px' }}>
                  {requestLoading ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
                <button onClick={() => { setShowRequestEditModal(false); setRequestEditNote('') }}
                  className="px-4 rounded-xl text-sm text-gray-400 transition"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>
                  Batal
                </button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}
      {/* Modal Request Approval (User) */}
      {showRequestApprovalModal && (
        <ModalWrapper onClose={() => { setShowRequestApprovalModal(false); setRequestApprovalNote('') }}>
          <ModalContent>
            <div className="p-6">
              <h3 className="text-base font-semibold text-white mb-1">Ajukan Persetujuan Proyek</h3>
              <p className="text-xs text-gray-500 mb-5">
                Permintaan akan dikirim ke Admin. Admin akan meninjau dan menyetujui proyek ini.
              </p>
              <div className="mb-5">
                <label className="block text-xs text-gray-500 mb-1.5">Catatan untuk Admin (opsional)</label>
                <textarea
                  value={requestApprovalNote}
                  onChange={(e) => setRequestApprovalNote(e.target.value)}
                  placeholder="Contoh: Proyek sudah siap untuk disetujui..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '16px' }}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleRequestApproval} disabled={requestApprovalLoading}
                  className="flex-1 rounded-xl text-white text-sm font-medium transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', minHeight: '48px' }}>
                  {requestApprovalLoading ? 'Mengirim...' : '📤 Kirim Permintaan'}
                </button>
                <button onClick={() => { setShowRequestApprovalModal(false); setRequestApprovalNote('') }}
                  className="px-4 rounded-xl text-sm text-gray-400 transition"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '48px' }}>
                  Batal
                </button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}
    </div>
  )
}