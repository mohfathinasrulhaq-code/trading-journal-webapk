import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { loadEnv } from './env'

let client: SupabaseClient<Database> | null = null

/**
 * Satu-satunya pintu untuk mendapatkan klien Supabase (singleton).
 * Dipanggil hanya dari modul `api` tiap fitur (aturan arsitektur Bagian 4.2).
 * Melempar galat jika konfigurasi env tidak valid; ConfigGate mencegah
 * kondisi itu tercapai saat aplikasi berjalan.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (client) return client

  const result = loadEnv()
  if (!result.ok) {
    throw new Error(`Konfigurasi Supabase tidak valid: ${result.errors.join(' ')}`)
  }

  client = createClient<Database>(result.env.supabaseUrl, result.env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}
