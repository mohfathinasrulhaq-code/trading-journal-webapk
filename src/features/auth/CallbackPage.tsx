import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircleIcon, LogoMark } from '@/components/ui/icons'
import { getSupabase } from '@/lib/supabase'

export default function CallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = getSupabase()

    // Supabase JS auto-detects session in URL hash / query with detectSessionInUrl: true.
    // We check getSession() or onAuthStateChange to proceed.
    supabase.auth
      .getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (!mounted) return
        if (sessionError) {
          setError(sessionError.message)
          return
        }
        if (session) {
          navigate('/', { replace: true })
        } else {
          // If no session yet, wait briefly for authStateChange (e.g. PKCE code exchange)
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (!mounted) return
            if (newSession) {
              subscription.unsubscribe()
              navigate('/', { replace: true })
            } else if (event === 'SIGNED_OUT') {
              setError('Sesi autentikasi telah berakhir.')
            }
          })
          // Fallback timeout in case no code/token found
          const timer = setTimeout(() => {
            if (mounted && !error) {
              navigate('/', { replace: true })
            }
          }, 3500)
          return () => {
            clearTimeout(timer)
            subscription.unsubscribe()
          }
        }
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Gagal memproses callback autentikasi.')
      })

    return () => {
      mounted = false
    }
  }, [navigate, error])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-app p-4 text-center text-fg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircleIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-semibold">Gagal Memverifikasi Sesi</h2>
        <p className="mt-2 text-xs text-muted max-w-sm">{error}</p>
        <Link
          to="/auth/login"
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-fg hover:opacity-90"
        >
          Kembali ke Halaman Login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-app p-4 text-center text-fg">
      <LogoMark className="h-10 w-10 animate-pulse text-primary" />
      <h2 className="mt-4 text-sm font-semibold">Memproses Autentikasi...</h2>
      <p className="mt-1 text-xs text-muted">Mohon tunggu sebentar, Anda akan segera dialihkan.</p>
    </div>
  )
}
