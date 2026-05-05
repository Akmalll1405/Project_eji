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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-root * { font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-0 { animation: fadeUp 0.5s ease both; }
        .fade-1 { animation: fadeUp 0.5s 0.06s ease both; }
        .fade-2 { animation: fadeUp 0.5s 0.12s ease both; }
        .fade-3 { animation: fadeUp 0.5s 0.18s ease both; }

        .bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          font-size: 14px;
          color: #0e1523;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
        }
        .login-input::placeholder { color: #b0bac9; }
        .login-input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.10);
        }

        .btn-login {
          width: 100%;
          padding: 13px;
          border-radius: 11px;
          background: #002147;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
          border: none;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          box-shadow: 0 2px 12px rgba(0,33,71,0.22);
        }
        .btn-login:hover {
          background: #003366;
          box-shadow: 0 4px 20px rgba(0,33,71,0.32);
          transform: translateY(-1px);
        }
        .btn-login:active { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
      `}</style>

      {/* Root */}
      <div
        className="login-root flex items-center justify-center bg-[#002147] px-4 relative overflow-hidden"
        style={{ minHeight: '100dvh' }}
      >
        {/* Background grid texture */}
        <div className="bg-grid" />

        {/* Subtle glow blobs */}
        <div
          style={{
            position: 'absolute', width: 340, height: 340, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)',
            top: -70, left: -70, pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute', width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,179,237,0.06) 0%, transparent 70%)',
            bottom: -50, right: -50, pointerEvents: 'none'
          }}
        />

        {/* Content wrapper */}
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-7">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3 fade-0">
            <div
              style={{
                width: 90, height: 90,
                borderRadius: 18,
                background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)',
                overflow: 'hidden'
              }}
            >
              <div className="relative w-25 h-25">
                <Image
                  src="/logopupuk.png"
                  alt="Logo"
                  fill
                  sizes="70px"
                  priority
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Card */}
          <div
            className="w-full fade-1"
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '32px 28px 28px',
              boxShadow: '0 8px 48px rgba(0,0,0,0.30), 0 1px 0 rgba(255,255,255,0.06)'
            }}
          >

            {/* Error */}
            {error && (
              <div
                style={{
                  background: '#fff5f5', border: '1px solid #fed7d7',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, color: '#c53030', textAlign: 'center',
                  marginBottom: 16
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email */}
              <div style={{ marginBottom: 16 }} className="fade-1">
                <label
                  style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#4a5568', marginBottom: 7 }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 0 }} className="fade-2">
                <label
                  style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#4a5568', marginBottom: 7 }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-input"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: '#94a3b8', display: 'flex', alignItems: 'center',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#edf2f7', margin: '20px 0' }} />

              {/* Button */}
              <div className="fade-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-login"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p
            className="fade-3"
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', textAlign: 'center' }}
          >
          SI-APUK (Sistem Informasi Arsip PUPUK)
          </p>
        </div>
      </div>
    </>
  )
}