'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/header'
import Loading from '@/components/Loading'

interface Project {
  id: string; nama: string; jenis: string; nilai: number
  penanggungjawab: string; wilayah: string; sektor: string
  tanggalMulai: string; tanggalSelesai: string; status: string
  userName: string; isApproved?: boolean
}
interface Donor {
  id: string; nama: string; jenis: string; penanggungjawab: string
  wilayah: string; alamat: string; tahunPendirian: number; lamaUsaha: number
}
interface Dokumen {
  id: string; jenisDokumen: string; fileUrl: string; fileName: string
  tanggalUpload: string; status: string; catatanAdmin: string
  approvedByName?: string; approvedAt?: string
}
interface Transaksi {
  id: string; namaProgram?: string; kegiatan?: string; staffCA?: string
  tanggalPengajuan?: string; tanggalPertanggungjawaban?: string
  kelengkapanDokumen?: string; statusTransaksi?: string; jenisPembayaran: string
  keterangan?: string; nomorRekening?: string; bankTujuan?: string
  jumlah: number; tanggalPembayaran: string; buktiBayarUrl?: string
  catatanAdmin?: string; statusApproval?: string
  approvedByName?: string; approvedAt?: string
}
interface Kegiatan {
  id: string; namaKegiatan: string; tanggalKegiatan: string
  fotoUrl?: string; fotoName?: string
}
interface TransaksiForm {
  namaProgram: string; kegiatan: string; staffCA: string
  tanggalPengajuan: string; tanggalPertanggungjawaban: string
  kelengkapanDokumen: string; jumlah: string; statusTransaksi: string
  keterangan: string; jenisPembayaran: string; nomorRekening: string
  bankTujuan: string; tanggalPembayaran: string; buktiBayarUrl: string
}

// ─── Design tokens ───
const C = {
  bg: '#f5f7ff', white: '#ffffff', border: '#e2e8f0',
  text: '#1e293b', textSub: '#475569', textMute: '#94a3b8',
  blue: '#2563eb', blueDark: '#1d4ed8', blueBg: '#eff6ff', blueBd: '#bfdbfe', blueText: '#1d4ed8',
  green: '#16a34a', greenBg: '#f0fdf4', greenBd: '#bbf7d0',
  amber: '#d97706', amberBg: '#fffbeb', amberBd: '#fde68a',
  red: '#dc2626', redBg: '#fef2f2', redBd: '#fecaca',
}

const card: React.CSSProperties = {
  background: C.white, borderRadius: 14,
  border: `1px solid ${C.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(37,99,235,0.05)',
}

// Input style — light theme
const inp = (disabled = false): React.CSSProperties => ({
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: `1.5px solid ${disabled ? '#f1f5f9' : C.border}`,
  background: disabled ? '#f8fafc' : C.white,
  color: disabled ? C.textMute : C.text,
  fontSize: 14, outline: 'none',
  cursor: disabled ? 'not-allowed' : 'text',
  WebkitAppearance: 'none',
  minHeight: 44,
})

// Modal components — white theme
const ModalWrapper = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
    {children}
  </div>
)

const ModalContent = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => (
  <div className={`w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} rounded-t-3xl sm:rounded-2xl overflow-y-auto`}
    style={{
      ...card, maxHeight: '92dvh',
      paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
      WebkitOverflowScrolling: 'touch',
    } as React.CSSProperties}>
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

  const [donorForm, setDonorForm] = useState({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' })
  const [kegiatanForm, setKegiatanForm] = useState({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' })
  const [editProyekForm, setEditProyekForm] = useState({ nama: '', jenis: '', nilai: '', penanggungjawab: '', wilayah: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: '' })
  const [transaksiForm, setTransaksiForm] = useState<TransaksiForm>({
    namaProgram: '', kegiatan: '', staffCA: '', tanggalPengajuan: '', tanggalPertanggungjawaban: '',
    kelengkapanDokumen: 'Lengkap', jumlah: '0', statusTransaksi: 'Transfer successful',
    keterangan: '', jenisPembayaran: 'TUNAI', nomorRekening: '', bankTujuan: '', tanggalPembayaran: '', buktiBayarUrl: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated') fetchAll()
  }, [status])

  const fetchAll = async () => {
    try {
      const res = await fetch(`/api/proyek/${id}`, { cache: 'no-cache' })
      if (!res.ok) throw new Error('Gagal')
      const data = await res.json()
      const p = Array.isArray(data) ? data[0] : data
      setProyek(p)
      setIsLocked(p.isApproved === true)
      setIsOwner((session?.user as any)?.role === 'ADMIN' || p.userId === (session?.user as any)?.id)
      setEditProyekForm({
        nama: p.nama || '', jenis: p.jenis || '', nilai: p.nilai?.toString() || '',
        penanggungjawab: p.penanggungjawab || '', wilayah: p.wilayah || '', sektor: p.sektor || '',
        tanggalMulai: p.tanggalMulai?.split('T')[0] || '',
        tanggalSelesai: p.tanggalSelesai?.split('T')[0] || '',
        status: p.status || 'PERENCANAAN'
      })
      await reloadAll()
      setLoading(false)
    } catch { alert('Gagal memuat data proyek'); setLoading(false) }
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
    } catch { }
  }

  const handleApproveProject = async () => {
    setProjectApprovalLoading(true)
    try {
      const res = await fetch(`/api/proyek/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ catatan: catatanApprovalProyek }) })
      if (!res.ok) throw new Error('Gagal')
      alert('✓ Proyek disetujui dan dikunci!')
      setShowProjectApprovalModal(false); setCatatanApprovalProyek(''); fetchAll()
    } catch { alert('Gagal menyetujui proyek') }
    finally { setProjectApprovalLoading(false) }
  }

  const handleRejectProject = async () => {
    if (!confirm('Yakin batalkan persetujuan proyek ini?')) return
    setProjectApprovalLoading(true)
    try {
      await fetch(`/api/proyek/${id}/reject`, { method: 'POST' })
      alert('Persetujuan proyek dibatalkan'); setShowProjectApprovalModal(false); fetchAll()
    } catch { alert('Gagal') }
    finally { setProjectApprovalLoading(false) }
  }

  const handleUnlockProject = async () => {
    if (!confirm('Buka kunci proyek ini untuk diedit?')) return
    try {
      await fetch(`/api/proyek/${id}/unlock`, { method: 'POST' })
      alert('✓ Proyek dibuka kuncinya'); setShowProjectApprovalModal(false); fetchAll()
    } catch { alert('Gagal membuka kunci') }
  }

  const handleRequestApproval = async () => {
    setRequestApprovalLoading(true)
    try {
      await fetch(`/api/proyek/${id}/request-edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: requestApprovalNote || 'Mohon persetujuan proyek ini', type: 'REQUEST_APPROVAL' }) })
      alert('✓ Permintaan persetujuan telah dikirim ke Admin!')
      setShowRequestApprovalModal(false); setRequestApprovalNote('')
    } catch { alert('Gagal mengirim permintaan') }
    finally { setRequestApprovalLoading(false) }
  }

  const handleRequestEdit = async () => {
    setRequestLoading(true)
    try {
      await fetch(`/api/proyek/${id}/request-edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: requestEditNote }) })
      alert('✓ Permintaan edit telah dikirim ke Admin!')
      setShowRequestEditModal(false); setRequestEditNote('')
    } catch { alert('Gagal mengirim permintaan') }
    finally { setRequestLoading(false) }
  }

  const handleUpdateProyek = async () => {
    if (!editProyekForm.nama.trim()) { alert('Nama Program wajib diisi!'); return }
    if (!editProyekForm.jenis.trim()) { alert('Deskripsi Program wajib diisi!'); return }
    if (!editProyekForm.sektor.trim()) { alert('Sektor wajib diisi!'); return }
    if (!editProyekForm.tanggalMulai) { alert('Tanggal Mulai wajib diisi!'); return }
    await fetch(`/api/proyek/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editProyekForm) })
    alert('Data proyek berhasil diupdate!')
  }

  const handleSaveDonor = async () => {
    if (editDonor) await fetch(`/api/donor/${editDonor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(donorForm) })
    else await fetch('/api/donor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...donorForm, projectId: id }) })
    setShowDonorForm(false); setEditDonor(null)
    setDonorForm({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' })
    reloadAll()
  }

  const handleDeleteDonor = async (donorId: string) => {
    if (!confirm('Yakin hapus donor ini?')) return
    await fetch(`/api/donor/${donorId}`, { method: 'DELETE' }); reloadAll()
  }

  const handleUploadDokumen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (isLocked && !isAdmin) { alert('Proyek terkunci. Ajukan permintaan edit ke Admin.'); return }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) { alert('Format file harus PDF, JPG, atau PNG!'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Ukuran file maksimal 10MB!'); return }
    setUploading(true)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const fd = new FormData(); fd.append('file', file); fd.append('projectId', id); fd.append('bucket', 'dokumen')
        const r = await fetch('/api/upload', { method: 'POST', body: fd }); const u = await r.json()
        if (!r.ok) throw new Error(u.error || 'Upload gagal')
        await fetch('/api/dokumen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jenisDokumen: selectedJenisDokumen, fileUrl: u.fileUrl, fileName: u.fileName, projectId: id }) })
        reloadAll(); alert('Dokumen berhasil diupload!'); break
      } catch (err: any) {
        if (attempt >= 3) alert(`Gagal upload: ${err.message}`)
        else await new Promise(r => setTimeout(r, 1500))
      }
    }
    setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUploadBuktiBayar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingBukti(true)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const fd = new FormData(); fd.append('file', file); fd.append('projectId', id); fd.append('bucket', 'bukti-bayar')
        const r = await fetch('/api/upload', { method: 'POST', body: fd }); const u = await r.json()
        if (!r.ok) throw new Error(u.error)
        setTransaksiForm(prev => ({ ...prev, buktiBayarUrl: u.fileUrl })); alert('Bukti bayar berhasil diupload!'); break
      } catch (err: any) { if (attempt >= 3) alert(`Gagal: ${err.message}`); else await new Promise(r => setTimeout(r, 1500)) }
    }
    setUploadingBukti(false)
  }

  const handleUploadFotoKegiatan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingFoto(true)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const fd = new FormData(); fd.append('file', file); fd.append('projectId', id); fd.append('bucket', 'kegiatan')
        const r = await fetch('/api/upload', { method: 'POST', body: fd }); const u = await r.json()
        if (!r.ok) throw new Error(u.error)
        setKegiatanForm(prev => ({ ...prev, fotoUrl: u.fileUrl, fotoName: u.fileName })); alert('Foto berhasil diupload!'); break
      } catch (err: any) { if (attempt >= 3) alert(`Gagal: ${err.message}`); else await new Promise(r => setTimeout(r, 1500)) }
    }
    setUploadingFoto(false)
  }

  const handleDeleteDokumen = async (dokumenId: string, fileUrl: string) => {
    if (!confirm('Yakin hapus dokumen ini?')) return
    const fileName = fileUrl.split('/dokumen/')[1]
    if (fileName) await supabase.storage.from('dokumen').remove([fileName])
    await fetch(`/api/dokumen/${dokumenId}`, { method: 'DELETE' }); reloadAll()
  }

  const handleApprovalDokumen = async (s: 'APPROVED' | 'REJECTED') => {
    if (!selectedDokumen) return
    setApprovalLoading(true)
    try {
      const res = await fetch(`/api/dokumen/${selectedDokumen.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s, catatanAdmin }) })
      if (!res.ok) throw new Error('Gagal')
      setShowApprovalModal(false); setSelectedDokumen(null); setCatatanAdmin(''); reloadAll()
      alert(s === 'APPROVED' ? '✓ Dokumen disetujui!' : '✗ Dokumen ditolak!')
    } catch (e) { alert('Gagal: ' + String(e)) }
    finally { setApprovalLoading(false) }
  }

  const resetTransaksiForm = () => {
    setTransaksiForm({ namaProgram: '', kegiatan: '', staffCA: '', tanggalPengajuan: '', tanggalPertanggungjawaban: '', kelengkapanDokumen: 'Lengkap', jumlah: '0', statusTransaksi: 'Transfer successful', keterangan: '', jenisPembayaran: 'TUNAI', nomorRekening: '', bankTujuan: '', tanggalPembayaran: '', buktiBayarUrl: '' })
    if (buktiBayarRef.current) buktiBayarRef.current.value = ''
  }

  const handleSaveTransaksi = async () => {
    if (!transaksiForm.namaProgram.trim()) { alert('Nama Program wajib diisi!'); return }
    if (!transaksiForm.staffCA.trim()) { alert('Staff CA wajib diisi!'); return }
    if (!transaksiForm.tanggalPengajuan) { alert('Tanggal Pengajuan wajib diisi!'); return }
    const payload = { ...transaksiForm, projectId: id, jumlah: parseFloat(transaksiForm.jumlah) || 0, tanggalPembayaran: transaksiForm.tanggalPengajuan }
    if (editTransaksi) await fetch(`/api/transaksi/${editTransaksi.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    else await fetch('/api/transaksi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm(); reloadAll()
  }

  const handleDeleteTransaksi = async (tId: string) => {
    if (!confirm('Yakin hapus transaksi ini?')) return
    await fetch(`/api/transaksi/${tId}`, { method: 'DELETE' }); reloadAll()
  }

  const handleTransaksiApproval = async (s: 'CLEAR' | 'NOT_CLEAR') => {
    if (!selectedTransaksi) return
    setTransaksiApprovalLoading(true)
    try {
      const res = await fetch(`/api/transaksi/${selectedTransaksi.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statusApproval: s, catatanAdmin: catatanAdminTransaksi }) })
      if (!res.ok) throw new Error('Gagal')
      setShowTransaksiApprovalModal(false); setSelectedTransaksi(null); setCatatanAdminTransaksi(''); reloadAll()
      alert(s === 'CLEAR' ? 'Transaksi Clear!' : 'Transaksi Not Clear!')
    } catch (e) { alert('Gagal: ' + String(e)) }
    finally { setTransaksiApprovalLoading(false) }
  }

  const handleSaveKegiatan = async () => {
    if (!kegiatanForm.namaKegiatan || !kegiatanForm.tanggalKegiatan) { alert('Nama kegiatan dan tanggal wajib diisi!'); return }
    if (editKegiatan) await fetch(`/api/kegiatan/${editKegiatan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kegiatanForm) })
    else await fetch('/api/kegiatan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...kegiatanForm, projectId: id }) })
    setShowKegiatanForm(false); setEditKegiatan(null)
    setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }); reloadAll()
  }

  const handleDeleteKegiatan = async (kId: string) => {
    if (!confirm('Yakin hapus kegiatan ini?')) return
    await fetch(`/api/kegiatan/${kId}`, { method: 'DELETE' }); reloadAll()
  }

  const fmtRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n)

  const jenisDokumenLabel: Record<string, string> = {
    PROPOSAL: 'Proposal', KONTRAK_KERJA: 'Kontrak Kerja', SURAT_IZIN: 'Surat Izin',
    DOKUMENTASI_KEGIATAN: 'Dokumentasi Kegiatan', LAPORAN_AKHIR: 'Laporan Akhir',
    SURAT_REKOMENDASI: 'Surat Rekomendasi', LAPORAN_PERIODIK: 'Laporan Periodik', LAIN_LAIN: 'Lain-lain'
  }
  const statusLabel: Record<string, string> = { PERENCANAAN: 'Draft', BERJALAN: 'Sedang Diproses', SELESAI: 'Selesai' }

  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const canEdit = isOwner && (!isLocked || isAdmin)

  // Lock banner — light theme
  const lockBanner = (() => {
    if (isAdmin) return null
    if (isLocked && isOwner) return (
      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: C.amberBg, border: `1px solid ${C.amberBd}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 2 }}>🔒 Proyek Terkunci</div>
        <div style={{ fontSize: 12, color: '#92400e' }}>Proyek telah disetujui Admin. Ajukan izin edit jika perlu perubahan.</div>
      </div>
    )
    if (!isOwner) return (
      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: C.redBg, border: `1px solid ${C.redBd}`, fontSize: 12, color: C.red, fontWeight: 600 }}>
        ⚠ Kamu hanya bisa melihat data proyek ini
      </div>
    )
    return null
  })()

  // Section header
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ padding: '10px 16px', borderRadius: 10, marginBottom: 16, background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {title}
    </div>
  )

  // Small action buttons
  const ActionBtn = ({ label, onClick, color = C.blue, bg = C.blueBg, bd = C.blueBd }: { label: string; onClick: () => void; color?: string; bg?: string; bd?: string }) => (
    <button onClick={onClick} style={{ fontSize: 12, padding: '5px 13px', borderRadius: 8, background: bg, color, border: `1px solid ${bd}`, cursor: 'pointer', fontWeight: 600, minHeight: 'auto' }}>
      {label}
    </button>
  )

  if (loading) return <Loading />

  return (
    <div style={{ minHeight: '100dvh', background: C.bg }}>
      <Header />
      <main style={{
        maxWidth: 900, margin: '0 auto',
        padding: '1rem calc(1rem + env(safe-area-inset-left,0px)) calc(2rem + env(safe-area-inset-bottom,0px)) calc(1rem + env(safe-area-inset-right,0px))',
      }}>

        {/* Back */}
        <button onClick={() => router.push('/dashboard')}
          style={{ fontSize: 13, color: C.blue, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, minHeight: 'auto', padding: 0 }}>
          ← Dashboard
        </button>

        {/* ─── Info Proyek ─── */}
        <div style={{ ...card, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {proyek?.nama}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                {proyek?.jenis && <span style={{ fontSize: 12, color: C.textMute }}>{proyek.jenis}</span>}
                {proyek?.wilayah && <>
                  <span style={{ color: C.border }}>•</span>
                  <span style={{ fontSize: 12, color: C.textMute }}>{proyek.wilayah}</span>
                </>}
                <span style={{
                  fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                  background: proyek?.status === 'BERJALAN' ? C.blueBg : proyek?.status === 'SELESAI' ? C.greenBg : '#f1f5f9',
                  color: proyek?.status === 'BERJALAN' ? C.blueText : proyek?.status === 'SELESAI' ? C.green : '#64748b',
                  border: proyek?.status === 'BERJALAN' ? `1px solid ${C.blueBd}` : proyek?.status === 'SELESAI' ? `1px solid ${C.greenBd}` : '1px solid #cbd5e1',
                }}>
                  {statusLabel[proyek?.status || '']}
                </span>
                <span style={{
                  fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                  background: isLocked ? C.greenBg : '#f1f5f9',
                  color: isLocked ? C.green : C.textMute,
                  border: isLocked ? `1px solid ${C.greenBd}` : '1px solid #cbd5e1',
                }}>
                  {isLocked ? 'Disetujui' : 'Menunggu'}
                </span>
              </div>
            </div>

            {/* Admin button */}
            {isAdmin && (
              <button onClick={() => setShowProjectApprovalModal(true)}
                style={{
                  fontSize: 12, padding: '8px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, minHeight: 40,
                  background: isLocked ? C.greenBg : C.amberBg,
                  border: isLocked ? `1px solid ${C.greenBd}` : `1px solid ${C.amberBd}`,
                  color: isLocked ? C.green : C.amber,
                }}>
                {isLocked ? 'Kelola' : 'Setujui'}
              </button>
            )}

            {/* User buttons */}
            {!isAdmin && isOwner && (
              !isLocked ? (
                <button onClick={() => setShowRequestApprovalModal(true)}
                  style={{ fontSize: 12, padding: '8px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, minHeight: 40, background: C.blueBg, border: `1px solid ${C.blueBd}`, color: C.blueText }}>
                  📤 Ajukan Persetujuan
                </button>
              ) : (
                <button onClick={() => setShowRequestEditModal(true)}
                  style={{ fontSize: 12, padding: '8px 14px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, minHeight: 40, background: C.amberBg, border: `1px solid ${C.amberBd}`, color: C.amber }}>
                  ✏️ Ajukan Edit
                </button>
              )
            )}
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'proyek', label: 'Data Proyek' }, { key: 'donor', label: 'Pendonor' },
            { key: 'dokumen', label: 'Dokumen' }, { key: 'keuangan', label: 'Keuangan' },
            { key: 'lainlain', label: 'Lain-Lain' },
          ].map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              style={{
                padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeSection === s.key ? C.blue : C.textMute,
                background: activeSection === s.key ? C.blueBg : 'transparent',
                borderRadius: '8px 8px 0 0', minHeight: 'auto', border: 'none',
                borderBottomStyle: 'solid',
                borderBottomWidth: activeSection === s.key ? 2:2,
                borderBottomColor: activeSection === s.key ? C.blue : 'transparent',
                userSelect: 'none',
                transition: 'all 0.2s ease',
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: DATA PROYEK ─── */}
        {activeSection === 'proyek' && (
          <div>
            <SectionHeader title="Data Program" />
            {lockBanner}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Deskripsi Program', key: 'jenis' }, { label: 'Nama Program', key: 'nama' },
                { label: 'Nilai Kontrak (Rp)', key: 'nilai' }, { label: 'Program Manager', key: 'penanggungjawab' },
                { label: 'Wilayah Pengerjaan', key: 'wilayah' }, { label: 'Sektor', key: 'sektor' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{label}</label>
                  <input type={key === 'nilai' ? 'number' : 'text'}
                    value={editProyekForm[key as keyof typeof editProyekForm]}
                    onChange={e => setEditProyekForm({ ...editProyekForm, [key]: e.target.value })}
                    disabled={!canEdit} style={inp(!canEdit)}
                    onFocus={e => { if (canEdit) { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.1)` } }}
                    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }} />
                </div>
              ))}
              {[{ label: 'Tanggal Mulai', key: 'tanggalMulai' }, { label: 'Tanggal Selesai', key: 'tanggalSelesai' }].map(({ label, key }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{label}</label>
                  <input type="date" value={editProyekForm[key as keyof typeof editProyekForm]}
                    onChange={e => setEditProyekForm({ ...editProyekForm, [key]: e.target.value })}
                    disabled={!canEdit} style={{ ...inp(!canEdit), colorScheme: 'light' } as React.CSSProperties}
                    onFocus={e => { if (canEdit) { e.target.style.borderColor = C.blue } }}
                    onBlur={e => { e.target.style.borderColor = C.border }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Status</label>
                <select value={editProyekForm.status} onChange={e => setEditProyekForm({ ...editProyekForm, status: e.target.value })}
                  disabled={!canEdit} style={{ ...inp(!canEdit), colorScheme: 'light' } as React.CSSProperties}>
                  <option value="PERENCANAAN">Draft</option>
                  <option value="BERJALAN">Sedang Diproses</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </div>
            </div>
            {canEdit && (
              <button onClick={handleUpdateProyek}
                style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', minHeight: 'auto' }}>
                Simpan Perubahan
              </button>
            )}
          </div>
        )}

        {/* ─── TAB: PENDONOR ─── */}
        {activeSection === 'donor' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <SectionHeader title="Data Pendonor" />
              {canEdit && (
                <button onClick={() => { setShowDonorForm(true); setEditDonor(null); setDonorForm({ nama: '', jenis: '', penanggungjawab: '', wilayah: '', alamat: '', tahunPendirian: '', lamaUsaha: '' }) }}
                  style={{ fontSize: 12, padding: '8px 14px', borderRadius: 9, background: C.blueBg, border: `1px solid ${C.blueBd}`, color: C.blueText, cursor: 'pointer', fontWeight: 700, flexShrink: 0, minHeight: 'auto' }}>
                  + Tambah
                </button>
              )}
            </div>
            {lockBanner}
            {donors.length === 0 ? <p style={{ color: C.textMute, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Belum ada data pendonor</p>
              : donors.map(d => (
                <div key={d.id} style={{ ...card, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', fontWeight: 700, fontSize: 13, color: C.text, background: C.blueBg, borderBottom: `1px solid ${C.blueBd}` }}>{d.nama}</div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, color: C.textSub, marginBottom: 8 }}>{d.alamat}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, marginBottom: 8 }}>
                      <div><span style={{ color: C.textMute }}>Tahun Pendirian: </span><span style={{ color: C.text, fontWeight: 600 }}>{d.tahunPendirian}</span></div>
                      <div><span style={{ color: C.textMute }}>Lama Usaha: </span><span style={{ color: C.text, fontWeight: 600 }}>{d.lamaUsaha} tahun</span></div>
                    </div>
                    <div style={{ fontSize: 12, color: C.textMute }}>PJ: <span style={{ color: C.text, fontWeight: 700 }}>{d.penanggungjawab}</span></div>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <ActionBtn label="Edit" onClick={() => { setEditDonor(d); setDonorForm({ nama: d.nama, jenis: d.jenis, penanggungjawab: d.penanggungjawab, wilayah: d.wilayah, alamat: d.alamat, tahunPendirian: d.tahunPendirian?.toString(), lamaUsaha: d.lamaUsaha?.toString() }); setShowDonorForm(true) }} />
                        <ActionBtn label="Hapus" onClick={() => handleDeleteDonor(d.id)} color={C.red} bg={C.redBg} bd={C.redBd} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ─── TAB: DOKUMEN ─── */}
        {activeSection === 'dokumen' && (
          <div>
            <SectionHeader title="Upload Dokumen" />
            {lockBanner}

            {/* Form upload */}
            {isOwner && (!isLocked || isAdmin) && (
              <div style={{ ...card, padding: 16, marginBottom: 16 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Jenis Dokumen</label>
                    <select value={selectedJenisDokumen} onChange={e => setSelectedJenisDokumen(e.target.value)} style={{ ...inp(), colorScheme: 'light' } as React.CSSProperties}>
                      {[['KONTRAK_KERJA','Kontrak Kerja'],['PROPOSAL','Proposal'],['SURAT_IZIN','Surat Izin'],['DOKUMENTASI_KEGIATAN','Dokumentasi Kegiatan'],['LAPORAN_AKHIR','Laporan Akhir'],['SURAT_REKOMENDASI','Surat Rekomendasi'],['LAPORAN_PERIODIK','Laporan Periodik'],['LAIN_LAIN','Lain-lain']].map(([v,l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>File</label>
                    <div style={{
                      borderRadius: 10, padding: '16px 12px', textAlign: 'center',
                      border: uploading ? `2px dashed ${C.blue}` : `2px dashed ${C.border}`,
                      background: uploading ? C.blueBg : '#fafbff',
                    }}>
                      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUploadDokumen} className="hidden" id="fileUpload" />
                      <label htmlFor="fileUpload" style={{ cursor: 'pointer', display: 'block' }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{uploading ? '⏳' : '📎'}</div>
                        <div style={{ fontSize: 12, color: C.textMute }}>{uploading ? 'Mengupload...' : 'Klik untuk upload'}</div>
                        <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>PDF, JPG, PNG (maks 10MB)</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Locked warning */}
            {isLocked && !isAdmin && isOwner && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: C.amberBg, border: `1px solid ${C.amberBd}`, fontSize: 12, color: '#92400e' }}>
                🔒 Upload dokumen tidak tersedia selama proyek terkunci. Ajukan pengeditan terlebih dahulu.
              </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[['Menunggu', C.amberBg, C.amber, C.amberBd], ['Disetujui', C.greenBg, C.green, C.greenBd], ['Ditolak', C.redBg, C.red, C.redBd]].map(([lbl, bg, tc, bd]) => (
                <span key={lbl as string} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: bg as string, color: tc as string, border: `1px solid ${bd}`, fontWeight: 600 }}>{lbl as string}</span>
              ))}
            </div>

            {dokumen.length === 0 ? <p style={{ color: C.textMute, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Belum ada dokumen</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dokumen.map(d => (
                    <div key={d.id} style={{ ...card, padding: 14, border: d.status === 'APPROVED' ? `1px solid ${C.greenBd}` : d.status === 'REJECTED' ? `1px solid ${C.redBd}` : `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fileName}</div>
                          <div style={{ fontSize: 11, color: C.textMute, marginBottom: 6 }}>{jenisDokumenLabel[d.jenisDokumen]} • {new Date(d.tanggalUpload).toLocaleDateString('id-ID')}</div>
                          <span style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700,
                            background: d.status === 'APPROVED' ? C.greenBg : d.status === 'REJECTED' ? C.redBg : C.amberBg,
                            color: d.status === 'APPROVED' ? C.green : d.status === 'REJECTED' ? C.red : C.amber,
                            border: `1px solid ${d.status === 'APPROVED' ? C.greenBd : d.status === 'REJECTED' ? C.redBd : C.amberBd}`,
                            display: 'inline-block',
                          }}>
                            {d.status === 'APPROVED' ? 'Disetujui' : d.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                          </span>
                          {d.catatanAdmin && (
                            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${C.border}`, fontSize: 12 }}>
                              <span style={{ color: C.textMute }}>Catatan: </span>
                              <span style={{ color: C.textSub, fontStyle: 'italic' }}>"{d.catatanAdmin}"</span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, fontWeight: 600, textDecoration: 'none' }}>Download</a>
                          {isAdmin && (
                            <button onClick={() => { setSelectedDokumen(d); setCatatanAdmin(d.catatanAdmin || ''); setShowApprovalModal(true) }}
                              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: C.amberBg, border: `1px solid ${C.amberBd}`, color: C.amber, cursor: 'pointer', fontWeight: 600, minHeight: 'auto' }}>
                              Review
                            </button>
                          )}
                          {isOwner && d.status !== 'APPROVED' && (
                            <button onClick={() => handleDeleteDokumen(d.id, d.fileUrl)}
                              style={{ fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, minHeight: 'auto', padding: 0 }}>Hapus</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ─── TAB: KEUANGAN ─── */}
        {activeSection === 'keuangan' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <SectionHeader title="Keuangan" />
              {canEdit && (
                <button onClick={() => { setShowTransaksiForm(true); setEditTransaksi(null); resetTransaksiForm() }}
                  style={{ fontSize: 12, padding: '8px 14px', borderRadius: 9, background: C.blueBg, border: `1px solid ${C.blueBd}`, color: C.blueText, cursor: 'pointer', fontWeight: 700, flexShrink: 0, minHeight: 'auto' }}>
                  + Pembayaran
                </button>
              )}
            </div>
            {lockBanner}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {[['Clear', C.greenBg, C.green, C.greenBd], ['Not Clear', C.redBg, C.red, C.redBd], ['Pending', C.amberBg, C.amber, C.amberBd]].map(([l, bg, tc, bd]) => (
                <span key={l as string} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: bg as string, color: tc as string, border: `1px solid ${bd}`, fontWeight: 600 }}>{l as string}</span>
              ))}
            </div>

            {/* Total */}
            <div style={{ ...card, padding: '14px 16px', marginBottom: 16, background: C.greenBg, border: `1px solid ${C.greenBd}` }}>
              <div style={{ fontSize: 11, color: C.textMute, fontWeight: 600, marginBottom: 4 }}>Total Pembayaran</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.green }}>{fmtRp(transaksi.reduce((a, t) => a + t.jumlah, 0))}</div>
            </div>

            {transaksi.length === 0 ? <p style={{ color: C.textMute, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Belum ada data keuangan</p>
              : transaksi.map(t => {
                const approvalSt = (t.statusApproval || 'PENDING').toUpperCase()
                const isClear = approvalSt === 'CLEAR'
                const isNotClear = approvalSt === 'NOT_CLEAR'
                return (
                  <div key={t.id} style={{ ...card, padding: 14, marginBottom: 10, border: isClear ? `1px solid ${C.greenBd}` : isNotClear ? `1px solid ${C.redBd}` : `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.namaProgram || t.keterangan || '-'}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: C.blueBg, color: C.blueText, border: `1px solid ${C.blueBd}`, fontWeight: 600 }}>{t.statusTransaksi || t.jenisPembayaran}</span>
                        </div>
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, display: 'inline-block', marginBottom: 8,
                          background: isClear ? C.greenBg : isNotClear ? C.redBg : C.amberBg,
                          color: isClear ? C.green : isNotClear ? C.red : C.amber,
                          border: `1px solid ${isClear ? C.greenBd : isNotClear ? C.redBd : C.amberBd}`,
                        }}>
                          {isClear ? 'Clear' : isNotClear ? 'Not Clear' : 'Pending Review'}
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: '2px 16px', fontSize: 12 }}>
                          {t.kegiatan && <div><span style={{ color: C.textMute }}>Kegiatan: </span><span style={{ color: C.text }}>{t.kegiatan}</span></div>}
                          {t.staffCA && <div><span style={{ color: C.textMute }}>Staff CA: </span><span style={{ color: C.text }}>{t.staffCA}</span></div>}
                          {t.tanggalPengajuan && <div><span style={{ color: C.textMute }}>Tgl: </span><span style={{ color: C.text }}>{new Date(t.tanggalPengajuan).toLocaleDateString('id-ID')}</span></div>}
                          {t.kelengkapanDokumen && <div><span style={{ color: C.textMute }}>Dok: </span><span style={{ color: t.kelengkapanDokumen === 'Lengkap' ? C.green : C.amber, fontWeight: 600 }}>{t.kelengkapanDokumen}</span></div>}
                          <div><span style={{ color: C.textMute }}>Nominal: </span><span style={{ color: C.green, fontWeight: 700 }}>{fmtRp(t.jumlah)}</span></div>
                        </div>
                        {t.buktiBayarUrl && <a href={t.buktiBayarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, fontWeight: 600, display: 'inline-block', marginTop: 6 }}>Lihat Bukti →</a>}
                        {t.catatanAdmin && (
                          <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${C.border}`, fontSize: 12 }}>
                            <span style={{ color: C.textMute }}>Catatan Admin: </span>
                            <span style={{ color: C.textSub, fontStyle: 'italic' }}>"{t.catatanAdmin}"</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                        {isAdmin && (
                          <button onClick={() => { setSelectedTransaksi(t); setCatatanAdminTransaksi(t.catatanAdmin || ''); setShowTransaksiApprovalModal(true) }}
                            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, minHeight: 'auto',
                              background: isClear ? C.greenBg : isNotClear ? C.redBg : C.amberBg,
                              border: `1px solid ${isClear ? C.greenBd : isNotClear ? C.redBd : C.amberBd}`,
                              color: isClear ? C.green : isNotClear ? C.red : C.amber,
                            }}>
                            {isClear || isNotClear ? 'Ubah' : 'Review'}
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button onClick={() => {
                              setEditTransaksi(t)
                              setTransaksiForm({ namaProgram: t.namaProgram||'', kegiatan: t.kegiatan||'', staffCA: t.staffCA||'', tanggalPengajuan: t.tanggalPengajuan?.split('T')[0]||'', tanggalPertanggungjawaban: t.tanggalPertanggungjawaban?.split('T')[0]||'', kelengkapanDokumen: t.kelengkapanDokumen||'Lengkap', jumlah: t.jumlah.toString(), statusTransaksi: t.statusTransaksi||'Transfer successful', keterangan: t.keterangan||'', jenisPembayaran: t.jenisPembayaran||'TUNAI', nomorRekening: t.nomorRekening||'', bankTujuan: t.bankTujuan||'', tanggalPembayaran: t.tanggalPembayaran?.split('T')[0]||'', buktiBayarUrl: t.buktiBayarUrl||'' })
                              setShowTransaksiForm(true)
                            }} style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, minHeight: 'auto', padding: 0 }}>Edit</button>
                            <button onClick={() => handleDeleteTransaksi(t.id)} style={{ fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, minHeight: 'auto', padding: 0 }}>Hapus</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* ─── TAB: LAIN-LAIN ─── */}
        {activeSection === 'lainlain' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <SectionHeader title="Lain-Lain" />
              {canEdit && (
                <button onClick={() => { setShowKegiatanForm(true); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }}
                  style={{ fontSize: 12, padding: '8px 14px', borderRadius: 9, background: C.blueBg, border: `1px solid ${C.blueBd}`, color: C.blueText, cursor: 'pointer', fontWeight: 700, flexShrink: 0, minHeight: 'auto' }}>
                  + Kegiatan
                </button>
              )}
            </div>
            {lockBanner}
            {kegiatan.length === 0 ? <p style={{ color: C.textMute, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Belum ada kegiatan</p>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kegiatan.map(k => (
                    <div key={k.id} style={{ ...card, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{k.namaKegiatan}</div>
                          <div style={{ fontSize: 12, color: C.textMute, marginTop: 2 }}>{new Date(k.tanggalKegiatan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                          {k.fotoUrl && (
                            <div style={{ marginTop: 10 }}>
                              <img src={k.fotoUrl} alt={k.namaKegiatan} style={{ width: 160, height: 112, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}`, display: 'block' }} />
                              <a href={k.fotoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, fontWeight: 600, marginTop: 4, display: 'block' }}>Lihat lengkap →</a>
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                            <ActionBtn label="Edit" onClick={() => { setEditKegiatan(k); setKegiatanForm({ namaKegiatan: k.namaKegiatan, tanggalKegiatan: k.tanggalKegiatan.split('T')[0], fotoUrl: k.fotoUrl||'', fotoName: k.fotoName||'' }); setShowKegiatanForm(true) }} />
                            <ActionBtn label="Hapus" onClick={() => handleDeleteKegiatan(k.id)} color={C.red} bg={C.redBg} bd={C.redBd} />
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

      {/* ════════════════════════════
          SEMUA MODAL — WHITE THEME
          ════════════════════════════ */}

      {/* Modal Project Approval */}
      {showProjectApprovalModal && (
        <ModalWrapper onClose={() => { setShowProjectApprovalModal(false); setCatatanApprovalProyek('') }}>
          <ModalContent>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Persetujuan Proyek</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proyek?.nama}</p>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: isLocked ? C.greenBg : C.amberBg, border: `1px solid ${isLocked ? C.greenBd : C.amberBd}` }}>
                <span style={{ fontSize: 12, color: C.textMute }}>Status: </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isLocked ? C.green : C.amber }}>{isLocked ? '✓ Sudah Disetujui & Terkunci' : '⏳ Belum Disetujui'}</span>
              </div>
              {!isLocked ? (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>Catatan (opsional)</label>
                    <textarea value={catatanApprovalProyek} onChange={e => setCatatanApprovalProyek(e.target.value)}
                      placeholder="Contoh: Proyek sudah memenuhi syarat..." rows={3}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.text, fontSize: 14, outline: 'none', resize: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleApproveProject} disabled={projectApprovalLoading}
                      style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.green},#15803d)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: projectApprovalLoading ? 0.6 : 1 }}>
                      {projectApprovalLoading ? '...' : '✓ Setujui & Kunci'}
                    </button>
                    <button onClick={() => { setShowProjectApprovalModal(false); setCatatanApprovalProyek('') }}
                      style={{ padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                      Batal
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>Proyek terkunci. Buka kunci agar user bisa edit, atau batalkan persetujuan.</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleUnlockProject} disabled={projectApprovalLoading}
                      style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      🔓 Buka Kunci
                    </button>
                    <button onClick={handleRejectProject} disabled={projectApprovalLoading}
                      style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.red},#b91c1c)`, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      ✗ Batalkan
                    </button>
                    <button onClick={() => setShowProjectApprovalModal(false)}
                      style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
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
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Review Keuangan</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>{selectedTransaksi.namaProgram || selectedTransaksi.keterangan || '-'}</p>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: C.textMute }}>Nominal: </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{fmtRp(selectedTransaksi.jumlah)}</span>
              </div>
              <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: C.blueBg, border: `1px solid ${C.blueBd}`, fontSize: 12 }}>
                <span style={{ color: C.textMute }}>Status saat ini: </span>
                <span style={{ fontWeight: 700, color: selectedTransaksi.statusApproval === 'CLEAR' ? C.green : selectedTransaksi.statusApproval === 'NOT_CLEAR' ? C.red : C.amber }}>
                  {selectedTransaksi.statusApproval === 'CLEAR' ? 'Clear' : selectedTransaksi.statusApproval === 'NOT_CLEAR' ? 'Not Clear' : 'Pending'}
                </span>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>Catatan (opsional)</label>
                <textarea value={catatanAdminTransaksi} onChange={e => setCatatanAdminTransaksi(e.target.value)}
                  placeholder="Contoh: Bukti pembayaran sudah sesuai..." rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.text, fontSize: 14, outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleTransaksiApproval('CLEAR')} disabled={transaksiApprovalLoading}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.green},#15803d)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: transaksiApprovalLoading ? 0.6 : 1 }}>
                  {transaksiApprovalLoading ? '...' : 'Clear'}
                </button>
                <button onClick={() => handleTransaksiApproval('NOT_CLEAR')} disabled={transaksiApprovalLoading}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.red},#b91c1c)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: transaksiApprovalLoading ? 0.6 : 1 }}>
                  {transaksiApprovalLoading ? '...' : 'Not Clear'}
                </button>
                <button onClick={() => { setShowTransaksiApprovalModal(false); setSelectedTransaksi(null); setCatatanAdminTransaksi('') }}
                  style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
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
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{editDonor ? 'Edit Donor' : 'Tambah Donor'}</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[{ l: 'Nama Yayasan/Lembaga', k: 'nama' }, { l: 'Alamat Lengkap', k: 'alamat' }, { l: 'Tahun Pendirian', k: 'tahunPendirian' }, { l: 'Lama Usaha (tahun)', k: 'lamaUsaha' }, { l: 'Penanggung Jawab', k: 'penanggungjawab' }].map(({ l, k }) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{l}</label>
                    <input type={['tahunPendirian','lamaUsaha'].includes(k) ? 'number' : 'text'}
                      value={donorForm[k as keyof typeof donorForm]}
                      onChange={e => setDonorForm({ ...donorForm, [k]: e.target.value })}
                      style={inp()} onFocus={e => { e.target.style.borderColor = C.blue }} onBlur={e => { e.target.style.borderColor = C.border }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleSaveDonor} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Simpan</button>
                <button onClick={() => { setShowDonorForm(false); setEditDonor(null) }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Batal</button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Transaksi */}
      {showTransaksiForm && (
        <ModalWrapper onClose={() => { setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm() }}>
          <ModalContent wide>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{editTransaksi ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {[{ l: 'Nama Program *', k: 'namaProgram' }, { l: 'Kegiatan', k: 'kegiatan' }, { l: 'Staff CA *', k: 'staffCA' }].map(({ l, k }) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{l}</label>
                    <input type="text" placeholder="ketik..." value={transaksiForm[k as keyof TransaksiForm]}
                      onChange={e => setTransaksiForm({ ...transaksiForm, [k]: e.target.value })}
                      style={inp()} onFocus={e => { e.target.style.borderColor = C.blue }} onBlur={e => { e.target.style.borderColor = C.border }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {[{ l: 'Tanggal Pengajuan *', k: 'tanggalPengajuan' }, { l: 'Tanggal Pertanggungjawaban', k: 'tanggalPertanggungjawaban' }].map(({ l, k }) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>{l}</label>
                    <input type="date" value={transaksiForm[k as keyof TransaksiForm]}
                      onChange={e => setTransaksiForm({ ...transaksiForm, [k]: e.target.value })}
                      style={{ ...inp(), colorScheme: 'light' } as React.CSSProperties} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Kelengkapan Dokumen</label>
                  <select value={transaksiForm.kelengkapanDokumen} onChange={e => setTransaksiForm({ ...transaksiForm, kelengkapanDokumen: e.target.value })} style={{ ...inp(), colorScheme: 'light' } as React.CSSProperties}>
                    <option value="Lengkap">Lengkap</option>
                    <option value="Kurang">Kurang</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Nominal Transaksi</label>
                  <input type="number" placeholder="0" value={transaksiForm.jumlah}
                    onChange={e => setTransaksiForm({ ...transaksiForm, jumlah: e.target.value })}
                    style={inp()} onFocus={e => { e.target.style.borderColor = C.blue }} onBlur={e => { e.target.style.borderColor = C.border }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Status</label>
                  <select value={transaksiForm.statusTransaksi} onChange={e => setTransaksiForm({ ...transaksiForm, statusTransaksi: e.target.value })} style={{ ...inp(), colorScheme: 'light' } as React.CSSProperties}>
                    <option value="Transfer successful">Transfer successful</option>
                    <option value="Settlement">Settlement</option>
                    <option value="clear">clear</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Keterangan</label>
                <input type="text" placeholder="Keterangan tambahan..." value={transaksiForm.keterangan}
                  onChange={e => setTransaksiForm({ ...transaksiForm, keterangan: e.target.value })}
                  style={inp()} onFocus={e => { e.target.style.borderColor = C.blue }} onBlur={e => { e.target.style.borderColor = C.border }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Bukti Pembayaran</label>
                <div style={{ borderRadius: 10, padding: 12, textAlign: 'center', border: `2px dashed ${C.border}`, background: '#fafbff' }}>
                  <input ref={buktiBayarRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUploadBuktiBayar} className="hidden" id="buktiBayarUpload" />
                  <label htmlFor="buktiBayarUpload" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>📎</div>
                    <div style={{ fontSize: 12, color: C.textMute }}>{uploadingBukti ? 'Mengupload...' : 'Klik untuk upload'}</div>
                  </label>
                </div>
                {transaksiForm.buktiBayarUrl && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Terupload</span>
                    <a href={transaksiForm.buktiBayarUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>Lihat →</a>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSaveTransaksi} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Simpan</button>
                <button onClick={() => { setShowTransaksiForm(false); setEditTransaksi(null); resetTransaksiForm() }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Batal</button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Kegiatan */}
      {showKegiatanForm && (
        <ModalWrapper onClose={() => { setShowKegiatanForm(false); setEditKegiatan(null) }}>
          <ModalContent>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{editKegiatan ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Nama Kegiatan *</label>
                  <input type="text" value={kegiatanForm.namaKegiatan} onChange={e => setKegiatanForm({ ...kegiatanForm, namaKegiatan: e.target.value })}
                    placeholder="Masukkan nama kegiatan" style={inp()} onFocus={e => { e.target.style.borderColor = C.blue }} onBlur={e => { e.target.style.borderColor = C.border }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Tanggal Kegiatan *</label>
                  <input type="date" value={kegiatanForm.tanggalKegiatan} onChange={e => setKegiatanForm({ ...kegiatanForm, tanggalKegiatan: e.target.value })}
                    style={{ ...inp(), colorScheme: 'light' } as React.CSSProperties} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>Foto Dokumentasi</label>
                  <div style={{ borderRadius: 10, padding: 16, textAlign: 'center', border: `2px dashed ${C.border}`, background: '#fafbff' }}>
                    <input ref={fotoKegiatanRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleUploadFotoKegiatan} className="hidden" id="fotoKegiatanUpload" />
                    <label htmlFor="fotoKegiatanUpload" style={{ cursor: 'pointer', display: 'block' }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>📷</div>
                      <div style={{ fontSize: 12, color: C.textMute }}>{uploadingFoto ? 'Mengupload...' : 'Klik untuk upload foto'}</div>
                    </label>
                  </div>
                  {kegiatanForm.fotoUrl && (
                    <div style={{ marginTop: 8 }}>
                      <img src={kegiatanForm.fotoUrl} alt="Preview" style={{ width: '100%', height: 112, objectFit: 'cover', borderRadius: 10, border: `1px solid ${C.border}` }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Terupload</span>
                        <button onClick={() => setKegiatanForm({ ...kegiatanForm, fotoUrl: '', fotoName: '' })} style={{ fontSize: 12, color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, minHeight: 'auto', padding: 0 }}>Hapus</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleSaveKegiatan} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Simpan</button>
                <button onClick={() => { setShowKegiatanForm(false); setEditKegiatan(null); setKegiatanForm({ namaKegiatan: '', tanggalKegiatan: '', fotoUrl: '', fotoName: '' }) }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Batal</button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Approval Dokumen */}
      {showApprovalModal && selectedDokumen && (
        <ModalWrapper onClose={() => { setShowApprovalModal(false); setSelectedDokumen(null); setCatatanAdmin('') }}>
          <ModalContent>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Review Dokumen</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedDokumen.fileName}</p>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: C.blueBg, border: `1px solid ${C.blueBd}`, fontSize: 12 }}>
                <span style={{ color: C.textMute }}>Status saat ini: </span>
                <span style={{ fontWeight: 700, color: selectedDokumen.status === 'APPROVED' ? C.green : selectedDokumen.status === 'REJECTED' ? C.red : C.amber }}>
                  {selectedDokumen.status === 'APPROVED' ? 'Disetujui' : selectedDokumen.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                </span>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>Catatan (opsional)</label>
                <textarea value={catatanAdmin} onChange={e => setCatatanAdmin(e.target.value)}
                  placeholder="Contoh: Dokumen sudah sesuai..." rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.text, fontSize: 14, outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleApprovalDokumen('APPROVED')} disabled={approvalLoading}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.green},#15803d)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: approvalLoading ? 0.6 : 1 }}>
                  {approvalLoading ? '...' : '✓ Setujui'}
                </button>
                <button onClick={() => handleApprovalDokumen('REJECTED')} disabled={approvalLoading}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.red},#b91c1c)`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: approvalLoading ? 0.6 : 1 }}>
                  {approvalLoading ? '...' : '✗ Tolak'}
                </button>
                <button onClick={() => { setShowApprovalModal(false); setSelectedDokumen(null); setCatatanAdmin('') }}
                  style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
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
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.amber},#b45309)`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Ajukan Permintaan Edit</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>Permintaan akan dikirim ke Admin untuk disetujui.</p>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>Alasan perlu diedit</label>
                <textarea value={requestEditNote} onChange={e => setRequestEditNote(e.target.value)}
                  placeholder="Contoh: Ada perubahan nilai kontrak..." rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.text, fontSize: 14, outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleRequestEdit} disabled={requestLoading}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: requestLoading ? 0.6 : 1 }}>
                  {requestLoading ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
                <button onClick={() => { setShowRequestEditModal(false); setRequestEditNote('') }}
                  style={{ padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Batal
                </button>
              </div>
            </div>
          </ModalContent>
        </ModalWrapper>
      )}

      {/* Modal Request Approval */}
      {showRequestApprovalModal && (
        <ModalWrapper onClose={() => { setShowRequestApprovalModal(false); setRequestApprovalNote('') }}>
          <ModalContent>
            <div style={{ padding: '20px 24px', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, borderRadius: '14px 14px 0 0' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Ajukan Persetujuan Proyek</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>Admin akan meninjau dan menyetujui proyek ini.</p>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 6 }}>Catatan untuk Admin (opsional)</label>
                <textarea value={requestApprovalNote} onChange={e => setRequestApprovalNote(e.target.value)}
                  placeholder="Contoh: Proyek sudah siap untuk disetujui..." rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.text, fontSize: 14, outline: 'none', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleRequestApproval} disabled={requestApprovalLoading}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.blue},${C.blueDark})`, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: requestApprovalLoading ? 0.6 : 1 }}>
                  {requestApprovalLoading ? 'Mengirim...' : '📤 Kirim Permintaan'}
                </button>
                <button onClick={() => { setShowRequestApprovalModal(false); setRequestApprovalNote('') }}
                  style={{ padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: '#f8fafc', color: C.textSub, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
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