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
        router.push('/dashboard'); return
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

  if (status === 'loading' || loading) return <Loading />
  if (status === 'unauthenticated') return null

  const card: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(37,99,235,0.05)',
  }

  const inputSt: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #e2e8f0',
    background: '#f8fafc',
    color: '#1e293b',
    fontSize: 14,
    outline: 'none',
  }

  const rolePill = (role: string): React.CSSProperties => ({
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 99,
    fontWeight: 700,
    background: role === 'ADMIN' ? '#f5f3ff' : '#eff6ff',
    color:      role === 'ADMIN' ? '#7c3aed'  : '#1d4ed8',
    border:     role === 'ADMIN' ? '1px solid #ddd6fe' : '1px solid #bfdbfe',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ minHeight: '100dvh', background: '#f5f7ff' }}>
      <Header />

      <main style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '1.5rem calc(1rem + env(safe-area-inset-left,0px)) calc(2rem + env(safe-area-inset-bottom,0px)) calc(1rem + env(safe-area-inset-right,0px))',
      }}>

        {/* ─── Page header ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
              Manajemen User
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              Kelola akun Admin dan Project Manager
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditUser(null); setForm({ name: '', email: '', password: '', role: 'PROJECT_MANAGER' }) }}
            style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)', minHeight: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            + Tambah User
          </button>
        </div>

        {/* ─── Tabel Desktop ─── */}
        <div className="hidden md:block" style={{ ...card, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                {['Nama', 'Email', 'Role', 'Dibuat', 'Aksi'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px',
                    fontSize: 11, color: 'rgba(255,255,255,0.85)',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
                    Belum ada user
                  </td>
                </tr>
              ) : users.map((u, i) => (
                <tr key={u.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: i % 2 === 0 ? '#ffffff' : '#fafbff',
                  }}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{u.name}</div>
                    {u.id === (session?.user as any)?.id && (
                      <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>(Anda)</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{u.email}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={rolePill(u.role)}>
                      {u.role === 'ADMIN' ? 'Admin' : 'Project Manager'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#94a3b8' }}>
                    {new Date(u.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setShowForm(true) }}
                        style={{
                          fontSize: 12, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                          background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8',
                          fontWeight: 600, minHeight: 'auto',
                        }}
                      >
                        Edit
                      </button>
                      {u.id !== (session?.user as any)?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{
                            fontSize: 12, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                            fontWeight: 600, minHeight: 'auto',
                          }}
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

        {/* ─── Card Mobile ─── */}
        <div className="md:hidden space-y-3">
          {users.length === 0 ? (
            <div style={{ ...card, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              Belum ada user
            </div>
          ) : users.map(u => (
            <div key={u.id} style={{ ...card, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{u.name}</div>
                  {u.id === (session?.user as any)?.id && (
                    <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>(Anda)</span>
                  )}
                </div>
                <span style={rolePill(u.role)}>
                  {u.role === 'ADMIN' ? 'Admin' : 'Project Manager'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: '#94a3b8' }}>Email: </span>
                  <span style={{ color: '#334155', fontWeight: 500, wordBreak: 'break-all' }}>{u.email}</span>
                </div>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: '#94a3b8' }}>Dibuat: </span>
                  <span style={{ color: '#334155', fontWeight: 500 }}>
                    {new Date(u.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                <button
                  onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setShowForm(true) }}
                  style={{
                    fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                    background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8',
                    fontWeight: 600, minHeight: 'auto',
                  }}
                >
                  Edit
                </button>
                {u.id !== (session?.user as any)?.id && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    style={{
                      fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                      background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                      fontWeight: 600, minHeight: 'auto',
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Modal ─── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }}
        >
          <div style={{
            ...card,
            width: '100%', maxWidth: 440,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              padding: '20px 24px',
              borderRadius: '14px 14px 0 0',
            }}>
              <h3 style={{ color: '#ffffff', fontWeight: 800, fontSize: 16 }}>
                {editUser ? 'Edit User' : 'Tambah User Baru'}
              </h3>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Nama Lengkap', key: 'name', type: 'text', placeholder: 'Masukkan nama' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'nama@email.com' },
                  {
                    label: editUser ? 'Password (kosongkan jika tidak diganti)' : 'Password',
                    key: 'password', type: 'password',
                    placeholder: editUser ? 'Kosongkan jika tidak diganti' : 'Masukkan password',
                  },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      style={inputSt}
                      onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    style={inputSt}
                  >
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Info Role */}
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: form.role === 'ADMIN' ? '#f5f3ff' : '#eff6ff',
                  border: form.role === 'ADMIN' ? '1px solid #ddd6fe' : '1px solid #bfdbfe',
                  fontSize: 12,
                  color: form.role === 'ADMIN' ? '#6d28d9' : '#1d4ed8',
                }}>
                  {form.role === 'ADMIN' ? (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Akses Admin</div>
                      <div>✓ Mengelola semua data & user</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Akses Project Manager</div>
                      <div>✓ Kelola proyek, dokumen, keuangan</div>
                      <div style={{ marginTop: 2, color: '#64748b' }}>✗ Tidak bisa kelola user</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1, padding: 13, borderRadius: 11, border: 'none',
                    background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  }}
                >
                  {editUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditUser(null) }}
                  style={{
                    flex: 1, padding: 13, borderRadius: 11,
                    border: '1.5px solid #e2e8f0',
                    background: '#f8fafc', color: '#64748b',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}