import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LogoMark } from '@/components/ui/icons'
import { useAuth } from './useAuth'

export function GuestGuard() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-app p-4 text-center">
        <LogoMark className="h-10 w-10 animate-pulse text-primary" />
        <p className="mt-4 text-sm text-muted">Memeriksa status login...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    const origin = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/'
    return <Navigate to={origin} replace />
  }

  return <Outlet />
}
