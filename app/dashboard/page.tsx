'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Project {
    id: string
    nama: string
    jenis: string
    nilai: number
    penanggungjawab: string
    perusahaan: string
    sektor: string
    tanggalMulai: string
    tanggalSelesai: string
    status: string
    user: { name: string }
    updatedAt: string
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('SEMUA')
    const [searchNama, setSearchNama] = useState('')
    const [searchPerusahaan, setSearchPerusahaan] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({
        nama: '', jenis: '', nilai: '', penanggungjawab: '',
        perusahaan: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN'
    })

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login')
        if (status === 'authenticated') fetchProjects()
    }, [status])

    const fetchProjects = async () => {
        const res = await fetch('/api/proyek')
        const data = await res.json()
        setProjects(Array.isArray(data) ? data : [])
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (!form.nama.trim()) {
            alert('Nama Pekerjaan wajib diisi!')
            return
        }
        if (!form.jenis.trim()) {
            alert('Jenis Pekerjaan wajib diisi!')
            return
        }
        if (!form.sektor.trim()) {
            alert('Sektor wajib diisi!')
            return
        }
        if (!form.tanggalMulai) {
            alert('Tanggal Mulai wajib diisi!')
            return
        }
        if (!form.tanggalSelesai) {
            alert('Tanggal Selesai wajib diisi!')
            return
        }
        if (new Date(form.tanggalSelesai) < new Date(form.tanggalMulai)) {
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
            perusahaan: '', sektor: '', tanggalMulai: '', tanggalSelesai: '', status: 'PERENCANAAN'
        })
    }

    const formatRupiah = (num: number) =>
        new Intl.NumberFormat('id-ID').format(num)

    const formatDate = (dateStr: string) => {
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
        if (p.status === 'SELESAI') return false
        const matchStatus = filterStatus === 'SEMUA' || p.status === filterStatus
        const matchNama = (p.nama || '').toLowerCase().includes(searchNama.toLowerCase())
        const matchPerusahaan = (p.perusahaan || '').toLowerCase().includes(searchPerusahaan.toLowerCase())
        return matchStatus && matchNama && matchPerusahaan
    })

    const totalProyek = projects.filter(p => p.status !== 'SELESAI').length
    const sedangBerjalan = projects.filter(p => p.status === 'BERJALAN').length
    const selesai = projects.filter(p => p.status === 'SELESAI').length

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">

            {/* Header */}
            <header className="bg-blue-500 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-blue-500 font-bold text-xs">
                        LOGO
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="bg-white rounded-full px-4 py-1 text-sm text-gray-600">
                        {session?.user?.email}
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="text-white font-bold underline">
                        Home
                    </button>
                    <button onClick={() => router.push('/report')} className="text-white font-bold underline">
                        Report
                    </button>
                    {(session?.user as any)?.role === 'ADMIN' && (
                        <button onClick={() => router.push('/users')} className="text-white font-bold underline">
                            Users
                        </button>
                    )}
                    <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-white text-sm border border-white px-3 py-1 rounded hover:bg-blue-600">
                        Logout
                    </button>
                </div>
            </header>

            <main className="px-6 py-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                        <h3 className="text-gray-500 text-sm">Total Proyek</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-1">{totalProyek}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                        <h3 className="text-gray-500 text-sm">Sedang Berjalan</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{sedangBerjalan}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                        <h3 className="text-gray-500 text-sm">Selesai</h3>
                        <p className="text-3xl font-bold text-green-600 mt-1">{selesai}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                        <h3 className="text-gray-500 text-sm">Hampir Selesai</h3>
                        <p className="text-3xl font-bold text-orange-500 mt-1">
                            {projects.filter(p => {
                                const selesaiDate = new Date(p.tanggalSelesai)
                                const today = new Date()
                                const diffDays = Math.ceil((selesaiDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                return diffDays <= 7 && diffDays >= 0 && p.status !== 'SELESAI'
                            }).length}
                        </p>
                    </div>
                </div>

                {/* Search */}
                {/* Search */}
                <div className="flex gap-4 mb-4 flex-wrap">
                    <div className="flex items-center border border-gray-300 rounded px-3 py-2 gap-2 bg-white">
                        <input
                            type="text"
                            placeholder="Cari nama pekerjaan..."
                            value={searchNama}
                            onChange={(e) => setSearchNama(e.target.value)}
                            className="outline-none text-sm text-gray-700 w-48"
                        />
                        <span>🔍</span>
                    </div>
                    <div className="flex items-center border border-gray-300 rounded px-3 py-2 gap-2 bg-white">
                        <input
                            type="text"
                            placeholder="Cari nama lembaga..."
                            value={searchPerusahaan}
                            onChange={(e) => setSearchPerusahaan(e.target.value)}
                            className="outline-none text-sm text-gray-700 w-48"
                        />
                        <span>🔍</span>
                    </div>
                    {(searchNama || searchPerusahaan) && (
                        <button
                            onClick={() => { setSearchNama(''); setSearchPerusahaan('') }}
                            className="text-xs text-gray-500 hover:text-red-500 underline px-2"
                        >
                            Reset pencarian
                        </button>
                    )}
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-3 mb-6 flex-wrap">
                    {['SEMUA', 'PERENCANAAN', 'BERJALAN'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded text-sm font-medium ${filterStatus === s
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                        >
                            {s === 'SEMUA' ? 'Semua' : statusLabel[s]}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 ml-auto"
                    >
                        + Pekerjaan
                    </button>
                </div>

                {/* Tabel */}
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2 px-3 text-gray-600 font-semibold">Update</th>
                            <th className="text-left py-2 px-3 text-gray-600 font-semibold">Pekerjaan</th>
                            <th className="text-left py-2 px-3 text-gray-600 font-semibold">Nilai</th>
                            <th className="text-left py-2 px-3 text-gray-600 font-semibold">Progres</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">Belum ada pekerjaan</td>
                            </tr>
                        ) : (
                            filtered.map((p) => (
                                <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-pre-line align-top">
                                        {formatDate(p.updatedAt)}
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                        <div className="text-gray-500 text-xs">Nama pekerjaan</div>
                                        <button
                                            onClick={() => router.push(`/proyek/${p.id}`)}
                                            className="text-blue-500 underline text-sm font-medium hover:text-blue-700"
                                        >
                                            {p.nama}
                                        </button>
                                        <div className="mt-2 text-xs text-gray-500">Penanggung Jawab</div>
                                        <div className="text-xs font-bold text-gray-700">{p.penanggungjawab}</div>
                                        <div className="mt-1 text-xs text-gray-500">Perusahaan</div>
                                        <div className="text-xs font-bold text-gray-700">{p.perusahaan}</div>
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                        <div className="text-xs text-gray-500">Nilai projek</div>
                                        <div className="text-sm font-bold text-gray-700">{formatRupiah(p.nilai)}</div>
                                        <div className="mt-2 text-xs text-gray-500">Jenis projek</div>
                                        <div className="text-sm font-bold text-gray-700">{p.jenis}</div>
                                    </td>
                                    <td className="py-3 px-3 align-top">
                                        <div className="text-xs text-gray-500">Diinput oleh</div>
                                        <div className="text-sm font-bold text-gray-700">{p.user?.name}</div>
                                        <div className="mt-2 text-xs text-gray-500">Status</div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded inline-block mt-1 ${p.status === 'BERJALAN' ? 'bg-blue-100 text-blue-700' :
                                            p.status === 'SELESAI' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {statusLabel[p.status]}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => router.push(`/proyek/${p.id}`)}
                                                className="text-blue-500 text-xs underline"
                                            >
                                                Detail
                                            </button>
                                            {(session?.user as any)?.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="text-red-500 text-xs underline"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

            </main>

            {/* Modal Form Tambah Pekerjaan */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-white mb-4">Tambah Pekerjaan</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Nama Pekerjaan', key: 'nama', type: 'text', required: true },
                                { label: 'Jenis Pekerjaan', key: 'jenis', type: 'text', required: true },
                                { label: 'Nilai Pekerjaan (Rp)', key: 'nilai', type: 'number', required: false },
                                { label: 'Penanggung Jawab', key: 'penanggungjawab', type: 'text', required: false },
                                { label: 'Perusahaan/Wilayah', key: 'wilayah', type: 'text', required: false },
                                { label: 'Sektor', key: 'sektor', type: 'text', required: true },
                                { label: 'Tanggal Mulai', key: 'tanggalMulai', type: 'date', required: true },
                                { label: 'Tanggal Selesai', key: 'tanggalSelesai', type: 'date', required: true },
                            ].map(({ label, key, type, required }) => (
                                <div key={key}>
                                    <label className="block text-xs text-gray-300 mb-1">
                                        {label} {required && <span className="text-red-400">*</span>}
                                    </label>
                                    <input
                                        type={type}
                                        value={form[key as keyof typeof form]}
                                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 ${required && !form[key as keyof typeof form]
                                            ? 'border-red-500'
                                            : 'border-gray-600'
                                            }`}
                                    />
                                    {required && !form[key as keyof typeof form] && (
                                        <p className="text-red-400 text-xs mt-1">Field ini wajib diisi</p>
                                    )}
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="PERENCANAAN">Draft</option>
                                    <option value="BERJALAN">Sedang Diproses</option>
                                    <option value="SELESAI">Selesai</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleSubmit}
                                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg font-medium transition"
                            >
                                Simpan
                            </button>
                            <button
                                onClick={() => { setShowForm(false); resetForm() }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}