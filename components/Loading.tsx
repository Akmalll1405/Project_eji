import Image from 'next/image'

export default function Loading() {
  return (
    <div
      className="flex items-center justify-center px-4"
      style={{ minHeight: '100dvh', background: '#f0f4ff'}}
    >
      <div className="flex flex-col items-center gap-5">

        {/* Logo */}
        <div className="relative w-14 h-14">
          <Image
            src="/logopupuk.png"
            alt="Logo"
            fill sizes="56px"
            priority
            className="object-contain"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(39, 99, 235, 0.25))' }}
          />
        </div>

        {/* Spinner */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent"
            style={{ animation: 'spin 1s linear infinite' }}
          ></div>
        </div>

        {/* Text */}
        <p
          className="text-xs tracking-widest uppercase font-semibold text-blue-500"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        >
          Memuat...
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}