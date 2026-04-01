'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-500 px-6 py-3 flex items-center justify-between">
        <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-blue-500 font-bold text-xs">LOGO</div>
        <div className="flex items-center gap-6">
          <div className="bg-white rounded-full px-4 py-1 text-sm text-gray-600">{session?.user?.email}</div>
          <button onClick={() => router.push('/dashboard')} className="text-white font-bold underline">Home</button>
          <button onClick={() => router.push('/report')} className="text-white font-bold underline">Report</button>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-white text-sm border border-white px-3 py-1 rounded hover:bg-blue-600">Logout</button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manajemen User</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola akun Admin dan Project Manager</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'PROJECT_MANAGER' }) }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Tambah User
          </button>
        </div>

        {/* Tabel User */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Nama</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Role</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Dibuat</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">Belum ada user</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{u.name}</div>
                    {u.id === (session?.user as any)?.id && (
                      <span className="text-xs text-blue-500">(Anda)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role === 'ADMIN' ? 'Admin' : 'Project Manager'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditUser(u)
                          setForm({ name: u.name, email: u.email, password: '', role: u.role })
                          setShowForm(true)
                        }}
                        className="text-blue-500 text-xs underline"
                      >
                        Edit
                      </button>
                      {u.id !== (session?.user as any)?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-red-500 text-xs underline"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal Form User */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">
              {editUser ? 'Edit User' : 'Tambah User Baru'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Masukkan nama lengkap" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Email <span className="text-red-400">*</span></label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="contoh@email.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  Password {!editUser && <span className="text-red-400">*</span>}
                  {editUser && <span className="text-gray-500">(kosongkan jika tidak diganti)</span>}
                </label>
                <input type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder={editUser ? 'Kosongkan jika tidak diganti' : 'Masukkan password'} />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1">Role <span className="text-red-400">*</span></label>
                <select value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Info akses role */}
              <div className={`rounded-lg p-3 text-xs ${form.role === 'ADMIN' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'}`}>
                {form.role === 'ADMIN' ? (
                  <div>
                    <div className="font-bold mb-1">Akses Admin:</div>
                    <div>✓ Mengelola semua data</div>
                    <div>✓ Menambah & mengelola user</div>
                    <div>✓ Akses semua fitur</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold mb-1">Akses Project Manager:</div>
                    <div>✓ Mengelola proyek</div>
                    <div>✓ Mengelola dokumen</div>
                    <div>✓ Mengelola keuangan</div>
                    <div>✗ Tidak bisa mengelola user</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit}
                className="flex-1 bg-blue-500 hover:bg-blue-400 text-white py-2 rounded-lg font-medium">
                {editUser ? 'Simpan Perubahan' : 'Tambah User'}
              </button>
              <button onClick={() => { setShowForm(false); setEditUser(null) }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}