import type { AppEnv } from './env'

export type ConnectionCheck =
  | { state: 'ok'; latencyMs: number }
  | { state: 'http-error'; httpStatus: number; latencyMs: number }
  | { state: 'timeout' }
  | { state: 'network-error' }

/**
 * Memeriksa apakah server Auth Supabase dapat dijangkau memakai URL dan key
 * dari env. Tidak memakai login, sesi, atau data pengguna.
 */
export async function checkSupabaseConnection(
  env: AppEnv,
  timeoutMs = 8000,
): Promise<ConnectionCheck> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const startedAt = performance.now()

  try {
    const response = await fetch(`${env.supabaseUrl}/auth/v1/health`, {
      headers: { apikey: env.supabaseAnonKey },
      signal: controller.signal,
    })
    const latencyMs = Math.round(performance.now() - startedAt)
    if (response.ok) return { state: 'ok', latencyMs }
    return { state: 'http-error', httpStatus: response.status, latencyMs }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { state: 'timeout' }
    }
    return { state: 'network-error' }
  } finally {
    clearTimeout(timer)
  }
}
