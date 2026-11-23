export interface AppEnv {
  supabaseUrl: string
  supabaseAnonKey: string
}

export type EnvResult =
  | { ok: true; env: AppEnv }
  | { ok: false; errors: string[] }

type RawEnv = Readonly<Record<string, unknown>>

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Membaca klaim `role` dari JWT tanpa verifikasi tanda tangan (hanya untuk deteksi salah pakai key). */
function readJwtRole(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload: unknown = JSON.parse(atob(padded))
    if (typeof payload === 'object' && payload !== null && 'role' in payload) {
      const role = (payload as { role: unknown }).role
      return typeof role === 'string' ? role : null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Memvalidasi variabel lingkungan. Fungsi murni (tidak membaca import.meta)
 * sehingga mudah diuji.
 */
export function parseEnv(raw: RawEnv): EnvResult {
  const errors: string[] = []
  const url = readString(raw.VITE_SUPABASE_URL)
  const key = readString(raw.VITE_SUPABASE_ANON_KEY)

  let supabaseUrl = ''
  if (!url) {
    errors.push('VITE_SUPABASE_URL belum diisi.')
  } else if (url.includes('your-project')) {
    errors.push('VITE_SUPABASE_URL masih berisi nilai contoh dari .env.example.')
  } else {
    try {
      const parsed = new URL(url)
      const isLocal = LOCAL_HOSTNAMES.has(parsed.hostname)
      const isSecure = parsed.protocol === 'https:'
      const isLocalHttp = parsed.protocol === 'http:' && isLocal
      if (isSecure || isLocalHttp) {
        supabaseUrl = parsed.origin
      } else {
        errors.push('VITE_SUPABASE_URL harus memakai https (http hanya diizinkan untuk localhost).')
      }
    } catch {
      errors.push('VITE_SUPABASE_URL bukan URL yang valid.')
    }
  }

  if (!key) {
    errors.push('VITE_SUPABASE_ANON_KEY belum diisi.')
  } else if (key.startsWith('your-')) {
    errors.push('VITE_SUPABASE_ANON_KEY masih berisi nilai contoh dari .env.example.')
  } else if (/\s/.test(key)) {
    errors.push('VITE_SUPABASE_ANON_KEY tidak boleh mengandung spasi.')
  } else if (key.startsWith('sb_secret_') || readJwtRole(key) === 'service_role') {
    errors.push(
      'VITE_SUPABASE_ANON_KEY berisi key rahasia (service_role/secret). Key ini tidak boleh dipakai di aplikasi browser. Gunakan anon key atau publishable key.',
    )
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, env: { supabaseUrl, supabaseAnonKey: key } }
}

let cached: EnvResult | null = null

/** Hasil validasi env aplikasi (dihitung sekali). */
export function loadEnv(): EnvResult {
  cached ??= parseEnv(import.meta.env)
  return cached
}
