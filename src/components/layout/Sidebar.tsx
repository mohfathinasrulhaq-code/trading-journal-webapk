import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/app/navigation'
import { LogoMark, LogOutIcon, UserIcon } from '@/components/ui/icons'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/cn'
import { APP_NAME } from '@/lib/constants'

export function Sidebar() {
  const { user, profile, logout } = useAuth()

  return (
    <aside className="hidden shrink-0 flex-col justify-between border-r border-line bg-surface p-4 md:sticky md:top-0 md:flex md:h-dvh md:w-60">
      <div>
        <div className="mb-6 flex items-center gap-3 px-2 pt-2">
          <LogoMark className="h-8 w-8" />
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>
        <nav aria-label="Navigasi utama (sisi)">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-sunken hover:text-fg',
                    )
                  }
                >
                  <Icon />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {user && (
        <div className="border-t border-line pt-4">
          <div className="flex items-center justify-between rounded-lg bg-app p-2.5">
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 overflow-hidden flex-1 hover:opacity-80 transition-opacity"
              title="Buka Profil Pengguna"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-xs uppercase">
                {profile?.display_name?.charAt(0) || user.email?.charAt(0) || <UserIcon className="h-4 w-4" />}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-fg">
                  {profile?.display_name || 'Trader'}
                </p>
                <p className="truncate text-[11px] text-muted">{user.email}</p>
              </div>
            </NavLink>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-surface transition-colors cursor-pointer shrink-0"
              title="Keluar"
              aria-label="Keluar dari akun"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
