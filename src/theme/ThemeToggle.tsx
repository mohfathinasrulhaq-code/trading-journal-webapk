import type { ComponentType, SVGProps } from 'react'
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons'
import { THEME_MODES, type ThemeMode } from './theme'
import { useTheme } from './useTheme'

const LABELS: Record<ThemeMode, string> = {
  light: 'Terang',
  dark: 'Gelap',
  system: 'Ikuti sistem',
}

const ICONS: Record<ThemeMode, ComponentType<SVGProps<SVGSVGElement>>> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
}

/** Tombol cepat di top bar: berganti Terang, Gelap, Ikuti sistem. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const next = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length]
  const Icon = ICONS[mode]
  const label = `Tema: ${LABELS[mode]}. Ketuk untuk beralih ke ${LABELS[next]}.`

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-fg"
    >
      <Icon />
    </button>
  )
}
