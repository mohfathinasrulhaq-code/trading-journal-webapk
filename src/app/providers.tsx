import type { ReactNode } from 'react'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ThemeProvider } from '@/theme/ThemeProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
