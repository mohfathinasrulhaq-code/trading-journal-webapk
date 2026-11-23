import { useEffect, useState } from 'react'
import { getOfflineQueue, processOfflineQueue } from '@/lib/offlineSyncQueue'
import { useOnlineStatus } from '@/lib/useOnlineStatus'

export function OfflineSyncBanner() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    const queue = getOfflineQueue()
    setPendingCount(queue.length)
  }, [isOnline])

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      setIsSyncing(true)
      processOfflineQueue().then(({ successCount, remaining }) => {
        setIsSyncing(false)
        setPendingCount(remaining)
        if (successCount > 0) {
          setSyncStatusMsg(`Berhasil menyinkronkan ${successCount} transaksi offline ke server.`)
          setTimeout(() => setSyncStatusMsg(null), 4000)
        }
      })
    }
  }, [isOnline, pendingCount, isSyncing])

  if (isOnline && !syncStatusMsg) {
    return null
  }

  if (syncStatusMsg) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="sticky top-0 z-40 bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between"
      >
        <span>✅ {syncStatusMsg}</span>
        <button
          type="button"
          onClick={() => setSyncStatusMsg(null)}
          className="hover:opacity-80 font-bold ml-2 cursor-pointer"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="sticky top-0 z-40 bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <span>
          <strong>Mode Offline Aktif</strong> — Koneksi internet tidak tersedia. Data transaksi akan disimpan lokal dan otomatis disinkronkan saat online.
        </span>
      </div>

      {pendingCount > 0 && (
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold">
          {pendingCount} antrean tertunda
        </span>
      )}
    </div>
  )
}
