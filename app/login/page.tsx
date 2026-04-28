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
        className="flex items-center justify-center bg-white px-4"
        style={{ minHeight: '100dvh' }}
      >
        <div className="w-full max-w-sm">

          {/* Logo & Title */}
          <div className="text-center mb-8 fade-up">
            <div className="flex justify-center mb-4">
              <div
                className="relative w-20 h-20 rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 4px 12px rgba(48, 117, 228, 0.47)' }}
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
            className="rounded-2xl p-8 fade-up-1 shadow-2xl border border-blue-200"
            style={{
              background: 'linear-gradient(145deg, #fafbff, #f8fafc)',
            }}
          >

            {/* Error */}
            {error && (
              <div
                className="mb-6 px-4 py-3 rounded-xl text-sm text-red-600 text-center font-medium"
                style={{ 
                  background: 'linear-gradient(145deg, #fef2f2, #fee2e2)', 
                  border: '1px solid rgba(239,68,68,0.15)',
                  boxShadow: '0 1px 3px rgba(239,68,68,0.1)'
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email */}
              <div className="fade-up-2">
                <label className="block text-sm text-gray-700 mb-2 ml-0.5 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm placeholder-gray-500 focus:outline-none transition-all duration-200"
                  style={{
                    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
                    e.target.style.background = 'linear-gradient(145deg, #ffffff, #f0f9ff)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid #e2e8f0'
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                    e.target.style.background = 'linear-gradient(145deg, #ffffff, #f8fafc)'
                  }}
                />
              </div>

              {/* Password */}
              <div className="fade-up-3">
                <label className="block text-sm text-gray-700 mb-2 ml-0.5 font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl text-gray-900 text-sm placeholder-gray-500 focus:outline-none transition-all duration-200"
                    style={{
                      background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1px solid #3b82f6'
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
                      e.target.style.background = 'linear-gradient(145deg, #ffffff, #f0f9ff)'
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #e2e8f0'
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                      e.target.style.background = 'linear-gradient(145deg, #ffffff, #f8fafc)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Button */}
              <div className="fade-up-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  style={{
                    background: loading
                      ? '#9ca3af'
                      : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    boxShadow: loading 
                      ? '0 1px 3px rgba(0,0,0,0.1)' 
                      : '0 4px 20px rgba(59,130,246,0.4)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border-2 border-white border-t-transparent inline-block"
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
          <p className="text-center text-xs text-gray-500 mt-8 fade-up-4 font-medium">
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