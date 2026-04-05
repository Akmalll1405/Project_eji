'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    setLoading(false)

    if (result?.ok) {
      router.push('/dashboard')
    } else {
      setError('Email atau password salah')
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .fade-up-1 { animation: fadeUp 0.5s 0.05s ease both; }
        .fade-up-2 { animation: fadeUp 0.5s 0.10s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.15s ease both; }
        .fade-up-4 { animation: fadeUp 0.5s 0.20s ease both; }
      `}</style>

      <div
        className="flex items-center justify-center bg-gray-950 px-4"
        style={{ minHeight: '100dvh' }}
      >
        <div className="w-full max-w-sm">

          {/* Logo & Title */}
          <div className="text-center mb-8 fade-up">
            <div className="flex justify-center mb-4">
              <div
                className="relative w-20 h-20 rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 0 32px rgba(59,130,246,0.25)' }}
              >
                <Image
                  src="/logopupuk.png"
                  alt="Logo"
                  fill
                  sizes="80px"
                  priority
                  className="object-contain p-1"
                />
              </div>
            </div>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-6 fade-up-1"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}
          >

            {/* Error */}
            {error && (
              <div
                className="mb-4 px-3 py-2 rounded-lg text-xs text-red-400 text-center"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">

              {/* Email */}
              <div className="fade-up-2">
                <label className="block text-xs text-gray-500 mb-1.5 ml-0.5">Email</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid rgba(59,130,246,0.5)'
                    e.target.style.background = 'rgba(59,130,246,0.05)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255,255,255,0.08)'
                    e.target.style.background = 'rgba(255,255,255,0.04)'
                  }}
                />
              </div>

              {/* Password */}
              <div className="fade-up-3">
                <label className="block text-xs text-gray-500 mb-1.5 ml-0.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1px solid rgba(59,130,246,0.5)'
                      e.target.style.background = 'rgba(59,130,246,0.05)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid rgba(255,255,255,0.08)'
                      e.target.style.background = 'rgba(255,255,255,0.04)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Button */}
              <div className="fade-up-4 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? 'rgba(59,130,246,0.5)'
                      : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.3)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent inline-block"
                        style={{ animation: 'spin 0.7s linear infinite' }}
                      />
                      Masuk...
                    </span>
                  ) : 'Masuk'}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-700 mt-6 fade-up-4">
            © {new Date().getFullYear()} Sistem Manajemen Proyek
          </p>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}