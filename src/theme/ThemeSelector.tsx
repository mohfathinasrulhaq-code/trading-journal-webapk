import type { ComponentType, SVGProps } from 'react'
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons'
import type { ThemeMode } from './theme'
import { useTheme } from './useTheme'

const OPTIONS: ReadonlyArray<{
  value: ThemeMode
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}> = [
  { value: 'light', label: 'Terang', icon: SunIcon },
  { value: 'dark', label: 'Gelap', icon: MoonIcon },
  { value: 'system', label: 'Sistem', icon: MonitorIcon },
]

/** Pilihan tema untuk halaman Pengaturan (radio group native, ramah keyboard). */
export function ThemeSelector() {
  const { mode, setMode, resolved } = useTheme()

  return (
    <fieldset>
      <legend className="text-sm font-medium">Tema tampilan</legend>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg border border-line bg-surface px-2 py-3 text-sm text-muted transition-colors peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
              <Icon />
              {label}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Tema yang sedang aktif: {resolved === 'dark' ? 'gelap' : 'terang'}.
      </p>
    </fieldset>
  )
}
