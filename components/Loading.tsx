import Image from 'next/image'

export default function Loading() {
  return (
    <div
      className="flex items-center justify-center bg-gray-950 px-4"
      style={{ minHeight: '100dvh' }}
    >
      <div className="flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="relative w-14 h-14 opacity-90">
          <Image
            src="/logopupuk.png"
            alt="Logo"
            fill
            sizes="56px"
            priority
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.5))' }}
          />
        </div>

        {/* Spinner */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-gray-800"></div>
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent"
            style={{ animation: 'spin 0.8s linear infinite' }}
          ></div>
        </div>

        {/* Text */}
        <p
          className="text-xs text-gray-500 tracking-widest uppercase"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        >
          Memuat
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