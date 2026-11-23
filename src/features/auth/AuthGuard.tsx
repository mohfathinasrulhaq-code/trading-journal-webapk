import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LogoMark } from '@/components/ui/icons'
import { useAuth } from './useAuth'

export function AuthGuard() {
  const { isAuthenticated, isLoading, isEmailVerified, user, resendVerificationEmail } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-app p-4 text-center">
        <LogoMark className="h-10 w-10 animate-pulse text-primary" />
        <p className="mt-4 text-sm text-muted">Memuat sesi pengguna...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col bg-app text-fg">
      {!isEmailVerified && user?.email && (
        <aside
          role="status"
          aria-label="Pemberitahuan verifikasi email"
          className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-700 dark:text-amber-300"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <span>
              Email Anda (<strong>{user.email}</strong>) belum diverifikasi. Cek kotak masuk atau folder spam Anda.
            </span>
            <button
              type="button"
              onClick={() => resendVerificationEmail(user.email ?? '')}
              className="underline font-semibold hover:opacity-80 transition-opacity cursor-pointer"
            >
              Kirim ulang verifikasi
            </button>
          </div>
        </aside>
      )}
      <Outlet />
    </div>
  )
}
