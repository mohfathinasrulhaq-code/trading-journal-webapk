import { useState, type FormEvent } from 'react'
import { AlertCircleIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import type { CloseTradeInput, TradeWithDetails } from './types'

interface Props {
  isOpen: boolean
  trade: TradeWithDetails | null
  onClose: () => void
  onSubmit: (id: string, input: CloseTradeInput) => Promise<void>
}

export function CloseTradeModal({ isOpen, trade, onClose, onSubmit }: Props) {
  const [exitPrice, setExitPrice] = useState('')
  const [grossPnl, setGrossPnl] = useState('')
  const [commission, setCommission] = useState('0')
  const [fee, setFee] = useState('0')
  const [swap, setSwap] = useState('0')
  const [notes, setNotes] = useState(trade?.notes || '')
  const [closedAt, setClosedAt] = useState(() => {
    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !trade) return null

  const isLong = trade.direction === 'long'
  const entry = Number(trade.entry_price)
  const size = Number(trade.position_size)

  // Handle Exit Price change with auto gross P&L estimation
  function handleExitPriceChange(val: string) {
    setExitPrice(val)
    const parsedExit = parseFloat(val)
    if (!isNaN(parsedExit) && parsedExit > 0 && entry > 0 && size > 0) {
      const estimatedGross = isLong
        ? (parsedExit - entry) * size
        : (entry - parsedExit) * size
      setGrossPnl(estimatedGross.toFixed(2))
    }
  }

  const parsedGross = parseFloat(grossPnl) || 0
  const parsedComm = parseFloat(commission) || 0
  const parsedFee = parseFloat(fee) || 0
  const parsedSwap = parseFloat(swap) || 0

  const netPnlPreview = parsedGross - parsedComm - parsedFee + parsedSwap
  const resultPreview =
    netPnlPreview > 0 ? 'WIN' : netPnlPreview < 0 ? 'LOSS' : 'BREAKEVEN'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedExit = parseFloat(exitPrice)
    if (isNaN(parsedExit) || parsedExit <= 0) {
      setError('Harga keluar (exit price) harus lebih besar dari 0.')
      return
    }

    if (isNaN(parsedGross)) {
      setError('Gross P&L harus berupa angka yang valid.')
      return
    }

    const closedTime = new Date(closedAt).getTime()
    const openedTime = new Date(trade!.opened_at).getTime()
    if (closedTime < openedTime) {
      setError('Waktu tutup posisi tidak boleh lebih awal dari waktu buka posisi.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(trade!.id, {
        exit_price: parsedExit,
        closed_at: new Date(closedAt).toISOString(),
        gross_pnl: parsedGross,
        commission: parsedComm,
        fee: parsedFee,
        swap: parsedSwap,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menutup posisi trade.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-fg">Tutup Posisi Trade</h3>
            <p className="text-xs text-muted">
              {trade.symbol} •{' '}
              <span className={isLong ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                {trade.direction.toUpperCase()}
              </span>{' '}
              • Lot: {trade.position_size} • Akun: {trade.account_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-fg text-sm p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400"
          >
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4 rounded-lg bg-sunken p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">Harga Entry:</span>
            <span className="font-mono font-medium text-fg">{entry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Waktu Buka:</span>
            <span className="text-fg">
              {new Date(trade.opened_at).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {trade.stop_loss && (
            <div className="flex justify-between">
              <span className="text-muted">Stop Loss:</span>
              <span className="font-mono text-red-500">{trade.stop_loss}</span>
            </div>
          )}
          {trade.take_profit && (
            <div className="flex justify-between">
              <span className="text-muted">Take Profit:</span>
              <span className="font-mono text-emerald-500">{trade.take_profit}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="close-exit-price" className="block text-xs font-medium text-fg mb-1">
                Harga Keluar (Exit Price) *
              </label>
              <input
                id="close-exit-price"
                type="number"
                step="any"
                min="0.00000001"
                required
                value={exitPrice}
                onChange={(e) => handleExitPriceChange(e.target.value)}
                placeholder="Contoh: 1.08900"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg font-mono focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="close-gross-pnl" className="block text-xs font-medium text-fg mb-1">
                Gross P&L ({trade.account_currency || 'USD'}) *
              </label>
              <input
                id="close-gross-pnl"
                type="number"
                step="any"
                required
                value={grossPnl}
                onChange={(e) => setGrossPnl(e.target.value)}
                placeholder="Hasil kotor (bisa disesuaikan)"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg font-mono focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Biaya Transaksi */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="close-comm" className="block text-[11px] font-medium text-muted mb-1">
                Komisi (≥ 0)
              </label>
              <input
                id="close-comm"
                type="number"
                step="any"
                min="0"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="block w-full rounded-lg border border-line bg-app py-1.5 px-2 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="close-fee" className="block text-[11px] font-medium text-muted mb-1">
                Fee (≥ 0)
              </label>
              <input
                id="close-fee"
                type="number"
                step="any"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="block w-full rounded-lg border border-line bg-app py-1.5 px-2 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="close-swap" className="block text-[11px] font-medium text-muted mb-1">
                Swap (+/-)
              </label>
              <input
                id="close-swap"
                type="number"
                step="any"
                value={swap}
                onChange={(e) => setSwap(e.target.value)}
                className="block w-full rounded-lg border border-line bg-app py-1.5 px-2 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Live Preview of Net PnL & Result */}
          <div className="rounded-xl border border-line bg-app/80 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Estimasi Net P&L:</span>
              <span
                className={`font-mono text-base font-bold ${
                  netPnlPreview > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : netPnlPreview < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-fg'
                }`}
              >
                {netPnlPreview > 0 ? '+' : ''}
                {netPnlPreview.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                <span className="ml-1 text-xs text-muted">{trade.account_currency}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Hasil Trade:</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  resultPreview === 'WIN'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : resultPreview === 'LOSS'
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {resultPreview}
              </span>
            </div>
          </div>

          {/* Closed At */}
          <div>
            <label htmlFor="close-time" className="block text-xs font-medium text-fg mb-1">
              Waktu Tutup Posisi *
            </label>
            <input
              id="close-time"
              type="datetime-local"
              required
              value={closedAt}
              onChange={(e) => setClosedAt(e.target.value)}
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
            />
          </div>

          {/* Exit notes */}
          <div>
            <label htmlFor="close-notes" className="block text-xs font-medium text-fg mb-1">
              Catatan Evaluasi / Exit
            </label>
            <textarea
              id="close-notes"
              rows={2}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Apakah sesuai plan? Hit SL/TP atau manual cut?"
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Tutup Posisi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
