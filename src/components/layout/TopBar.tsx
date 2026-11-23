import { Link } from 'react-router-dom'
import { LogoMark, LogOutIcon, UserIcon } from '@/components/ui/icons'
import { useAuth } from '@/features/auth/useAuth'
import { APP_NAME } from '@/lib/constants'
import { ThemeToggle } from '@/theme/ThemeToggle'

export function TopBar() {
  const { user, profile, logout, isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-app/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:justify-end md:px-8">
        <div className="flex items-center gap-2 md:hidden">
          <LogoMark className="h-7 w-7" />
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg py-1 px-2 text-xs text-muted hover:bg-surface hover:text-fg transition-colors"
                title="Buka Profil Pengguna"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-xs uppercase">
                  {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || <UserIcon className="h-3.5 w-3.5" />}
                </div>
                <span className="hidden sm:inline font-medium">
                  {profile?.display_name || user?.email}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-red-500 transition-colors cursor-pointer"
                title="Keluar"
                aria-label="Keluar dari akun"
              >
                <LogOutIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
