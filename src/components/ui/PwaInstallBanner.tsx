import { useState } from 'react'
import { LogoMark } from './icons'
import { usePwaInstall } from '@/lib/usePwaInstall'

export function PwaInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall()
  const [isDismissed, setIsDismissed] = useState(false)

  if (!canInstall || isInstalled || isDismissed) {
    return null
  }

  return (
    <div
      role="banner"
      aria-label="Pemasangan Aplikasi PWA"
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2 text-xs text-fg backdrop-blur-md"
    >
      <div className="flex items-center gap-2.5">
        <LogoMark className="h-5 w-5 shrink-0 text-primary" />
        <span>
          Pasang <strong>Trading Journal WebAPK</strong> di perangkat Anda (Desktop / Android) untuk akses cepat & offline shell.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => promptInstall()}
          className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-fg hover:opacity-90 transition-opacity cursor-pointer text-xs"
        >
          Pasang Sekarang
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 text-muted hover:text-fg transition-colors cursor-pointer"
          aria-label="Tutup pemberitahuan pemasangan"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
