import type { ReactNode } from 'react'
import { LogoMark } from '@/components/ui/icons'
import { APP_NAME } from '@/lib/constants'
import { ThemeToggle } from '@/theme/ThemeToggle'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-app px-4 py-8 text-fg sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-12 w-12" />
          <h1 className="mt-4 text-xl font-bold tracking-tight text-fg sm:text-2xl">
            {APP_NAME}
          </h1>
          <h2 className="mt-2 text-base font-semibold text-fg">{title}</h2>
          {subtitle && <p className="mt-1 text-xs sm:text-sm text-muted">{subtitle}</p>}
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
