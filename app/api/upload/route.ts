export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          // Tambah timeout 30 detik
          signal: AbortSignal.timeout(30000),
        })
      }
    }
  }
)

async function uploadWithRetry(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string,
  maxRetries = 3
): Promise<{ data: any; error: any }> {
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}...`)
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true,
        })

      if (!error) return { data, error: null }
      lastError = error
      console.error(`Attempt ${attempt} failed:`, error.message)

      // Tunggu sebelum retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    } catch (err) {
      lastError = err
      console.error(`Attempt ${attempt} threw:`, err)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }

  return { data: null, error: lastError }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const bucket = formData.get('bucket') as string || 'dokumen'

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 })
    }

    // Konversi file ke Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Buat nama file unik
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${projectId}/${timestamp}_${safeFileName}`

    console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`)

    // Upload dengan retry
    const { data, error } = await uploadWithRetry(bucket, filePath, fileBuffer, file.type)

    if (error) {
      console.error('Upload final error:', error)
      return NextResponse.json(
        { error: `Gagal upload: ${error.message || 'Koneksi ke storage gagal, coba lagi'}` },
        { status: 500 }
      )
    }

    // Ambil public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return NextResponse.json({
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      filePath
    })

  } catch (error: any) {
    console.error('Upload route error:', error)

    // Pesan error yang lebih friendly
    let message = 'Gagal upload file'
    if (error?.code === 'ECONNRESET') {
      message = 'Koneksi terputus. Coba lagi.'
    } else if (error?.name === 'TimeoutError') {
      message = 'Upload timeout. Coba file yang lebih kecil atau cek koneksi internet.'
    } else if (error?.message) {
      message = error.message
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}