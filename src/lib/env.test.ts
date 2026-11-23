import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

function fakeJwt(payload: Record<string, unknown>): string {
  return `${btoa('{"alg":"HS256","typ":"JWT"}')}.${btoa(JSON.stringify(payload))}.signature`
}

const VALID_URL = 'https://abcdefghij.supabase.co'
const ANON_KEY = fakeJwt({ role: 'anon' })

describe('parseEnv', () => {
  it('menerima konfigurasi yang valid', () => {
    const result = parseEnv({ VITE_SUPABASE_URL: VALID_URL, VITE_SUPABASE_ANON_KEY: ANON_KEY })
    expect(result).toEqual({
      ok: true,
      env: { supabaseUrl: VALID_URL, supabaseAnonKey: ANON_KEY },
    })
  })

  it('menormalkan URL menjadi origin (membuang slash dan path)', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: `${VALID_URL}/rest/v1/`,
      VITE_SUPABASE_ANON_KEY: ANON_KEY,
    })
    expect(result.ok && result.env.supabaseUrl).toBe(VALID_URL)
  })

  it('menerima publishable key baru', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: VALID_URL,
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_abc123',
    })
    expect(result.ok).toBe(true)
  })

  it('menolak variabel yang kosong atau tidak ada', () => {
    const result = parseEnv({})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toHaveLength(2)
  })

  it('menolak nilai contoh dari .env.example', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: 'https://your-project-ref.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your-anon-or-publishable-key',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors).toHaveLength(2)
  })

  it('menolak URL yang tidak valid', () => {
    const result = parseEnv({ VITE_SUPABASE_URL: 'bukan-url', VITE_SUPABASE_ANON_KEY: ANON_KEY })
    expect(result.ok).toBe(false)
  })

  it('menolak http untuk host non-lokal', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: 'http://abcdefghij.supabase.co',
      VITE_SUPABASE_ANON_KEY: ANON_KEY,
    })
    expect(result.ok).toBe(false)
  })

  it('mengizinkan http untuk localhost (Supabase lokal)', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: ANON_KEY,
    })
    expect(result.ok && result.env.supabaseUrl).toBe('http://127.0.0.1:54321')
  })

  it('menolak key service_role (JWT)', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: VALID_URL,
      VITE_SUPABASE_ANON_KEY: fakeJwt({ role: 'service_role' }),
    })
    expect(result.ok).toBe(false)
  })

  it('menolak secret key baru (sb_secret_)', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: VALID_URL,
      VITE_SUPABASE_ANON_KEY: 'sb_secret_abc123',
    })
    expect(result.ok).toBe(false)
  })

  it('menolak key yang mengandung spasi', () => {
    const result = parseEnv({
      VITE_SUPABASE_URL: VALID_URL,
      VITE_SUPABASE_ANON_KEY: 'abc def',
    })
    expect(result.ok).toBe(false)
  })
})
