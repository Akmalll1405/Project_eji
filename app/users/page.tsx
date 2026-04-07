'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import Loading from '@/components/Loading'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'PROJECT_MANAGER'
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      if ((session?.user as any)?.role !== 'ADMIN') {
        router.push('/dashboard')
        return
      }
      fetchUsers()
    }
  }, [status])

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  if (status === 'loading' || loading) return <Loading />
  if (status === 'unauthenticated') return null

  const handleSubmit = async () => {
    if (!form.name.trim()) { alert('Nama wajib diisi!'); return }
    if (!form.email.trim()) { alert('Email wajib diisi!'); return }
    if (!editUser && !form.password.trim()) { alert('Password wajib diisi!'); return }

    if (editUser) {
      await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    } else {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Gagal membuat user'); return }
    }

    setShowForm(false)
    setEditUser(null)
    setForm({ name: '', email: '', password: '', role: 'PROJECT_MANAGER' })
    fetchUsers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    fetchUsers()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: '#030712' }}>
      <Header />

      <main className="px-4 sm:px-6 py-4 sm:py-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-lg font-semibold text-white">Manajemen User</h1>
            <p className="text-xs text-gray-600 mt-1">Kelola akun Admin dan Project Manager</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'PROJECT_MANAGER' }) }}
            className="px-4 py-2 rounded-xl text-white text-xs font-medium transition"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            + Tambah User
          </button>
        </div>

        {/* Tabel Desktop */}
        <div className="hidden md:block rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Nama', 'Email', 'Role', 'Dibuat', 'Aksi'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-600">Belum ada user</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-white/[0.02] transition"
                  style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="py-3 px-4">
                    <div className="text-gray-200 text-sm">{u.name}</div>
                    {u.id === (session?.user as any)?.id && <span className="text-xs text-blue-400">(Anda)</span>}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                      {u.role === 'ADMIN' ? 'Admin' : 'Project Manager'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-3">
                      <button onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setShowForm(true) }}
                        className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                      {u.id !== (session?.user as any)?.id && (
                        <button onClick={() => handleDelete(u.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
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
          {users.length === 0 ? (
            <p className="text-center py-10 text-gray-600">Belum ada user</p>
          ) : users.map((u) => (
            <div key={u.id} className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-gray-200 text-sm font-medium">{u.name}</div>
                  {u.id === (session?.user as any)?.id && <span className="text-xs text-blue-400">(Anda)</span>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                  {u.role === 'ADMIN' ? 'Admin' : 'Project Manager'}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <div>Email: <span className="text-gray-400 break-all">{u.email}</span></div>
                <div>Dibuat: <span className="text-gray-400">{new Date(u.createdAt).toLocaleDateString('id-ID')}</span></div>
              </div>
              <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setShowForm(true) }}
                  className="text-blue-400 text-xs hover:text-blue-300 transition">Edit</button>
                {u.id !== (session?.user as any)?.id && (
                  <button onClick={() => handleDelete(u.id)} className="text-red-400 text-xs hover:text-red-300 transition">Hapus</button>
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
          <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-base font-semibold text-white mb-5">
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Nama Lengkap', key: 'name', type: 'text', placeholder: 'Masukkan nama' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'nama@email.com' },
                { label: editUser ? 'Password (kosongkan jika tidak diganti)' : 'Password', key: 'password', type: 'password', placeholder: editUser ? 'Kosongkan jika tidak diganti' : 'Masukkan password' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none transition"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <option value="PROJECT_MANAGER" className="bg-gray-900">Project Manager</option>
                  <option value="ADMIN" className="bg-gray-900">Admin</option>
                </select>
              </div>
              <div className={`rounded-xl p-3 text-xs ${form.role === 'ADMIN' ? 'bg-purple-500/5 border border-purple-500/15 text-purple-400' : 'bg-blue-500/5 border border-blue-500/15 text-blue-400'}`}>
                {form.role === 'ADMIN' ? (
                  <div><div className="font-medium mb-1">Akses Admin</div><div>✓ Mengelola semua data & user</div></div>
                ) : (
                  <div><div className="font-medium mb-1">Akses Project Manager</div><div>✓ Proyek, dokumen, keuangan</div><div>✗ Tidak bisa kelola user</div></div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                {editUser ? 'Simpan' : 'Tambah User'}
              </button>
              <button onClick={() => { setShowForm(false); setEditUser(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 transition"
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