import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DARK_QUERY,
  applyTheme,
  getSystemPrefersDark,
  readStoredMode,
  resolveTheme,
  writeStoredMode,
  type ThemeMode,
} from './theme'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)
  const [systemDark, setSystemDark] = useState<boolean>(getSystemPrefersDark)

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  const resolved = resolveTheme(mode, systemDark)

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    writeStoredMode(next)
  }, [])

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
