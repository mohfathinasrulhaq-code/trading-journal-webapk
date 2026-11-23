import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircleIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import type { AccountWithBalance } from '@/features/accounts/types'
import type { MarketType, TradeDirection } from '@/types/database'
import { createStrategy, fetchStrategies } from './api'
import type { CreateTradeInput, StrategyItem } from './types'

interface Props {
  isOpen: boolean
  accounts: AccountWithBalance[]
  defaultAccountId?: string
  onClose: () => void
  onSubmit: (input: CreateTradeInput) => Promise<void>
}

const MARKET_TYPES: { value: MarketType; label: string }[] = [
  { value: 'forex', label: 'Forex (Valas)' },
  { value: 'crypto', label: 'Kripto (Crypto)' },
  { value: 'commodity', label: 'Komoditas (Gold/Oil)' },
  { value: 'index', label: 'Indeks Saham' },
  { value: 'stock', label: 'Saham (Equities)' },
  { value: 'other', label: 'Lainnya' },
]

export function TradeModal({
  isOpen,
  accounts,
  defaultAccountId,
  onClose,
  onSubmit,
}: Props) {
  const [accountId, setAccountId] = useState(defaultAccountId || accounts[0]?.id || '')
  const [symbol, setSymbol] = useState('')
  const [marketType, setMarketType] = useState<MarketType>('forex')
  const [direction, setDirection] = useState<TradeDirection>('long')
  const [entryPrice, setEntryPrice] = useState('')
  const [positionSize, setPositionSize] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [riskAmount, setRiskAmount] = useState('')
  const [strategyId, setStrategyId] = useState('')
  const [notes, setNotes] = useState('')
  const [openedAt, setOpenedAt] = useState(() => {
    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
  })

  // Strategies list & creation
  const [strategies, setStrategies] = useState<StrategyItem[]>([])
  const [showNewStrategy, setShowNewStrategy] = useState(false)
  const [newStrategyName, setNewStrategyName] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchStrategies().then(setStrategies).catch(() => {})
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0]

  async function handleAddStrategy() {
    if (!newStrategyName.trim()) return
    try {
      const created = await createStrategy(newStrategyName)
      setStrategies((prev) => [...prev, created])
      setStrategyId(created.id)
      setNewStrategyName('')
      setShowNewStrategy(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat strategi.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!accountId) {
      setError('Pilih akun trading tujuan.')
      return
    }

    if (!symbol.trim()) {
      setError('Simbol pair/aset trading wajib diisi.')
      return
    }

    const parsedEntry = parseFloat(entryPrice)
    if (isNaN(parsedEntry) || parsedEntry <= 0) {
      setError('Harga masuk (entry price) harus berupa angka positif.')
      return
    }

    const parsedSize = parseFloat(positionSize)
    if (isNaN(parsedSize) || parsedSize <= 0) {
      setError('Ukuran posisi / lot harus berupa angka positif.')
      return
    }

    const parsedSL = stopLoss ? parseFloat(stopLoss) : null
    if (parsedSL !== null && (isNaN(parsedSL) || parsedSL <= 0)) {
      setError('Stop Loss harus berupa angka positif.')
      return
    }

    const parsedTP = takeProfit ? parseFloat(takeProfit) : null
    if (parsedTP !== null && (isNaN(parsedTP) || parsedTP <= 0)) {
      setError('Take Profit harus berupa angka positif.')
      return
    }

    const parsedRisk = riskAmount ? parseFloat(riskAmount) : null
    if (parsedRisk !== null && (isNaN(parsedRisk) || parsedRisk <= 0)) {
      setError('Risk amount harus berupa angka positif.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        account_id: accountId,
        strategy_id: strategyId || null,
        symbol: symbol.trim().toUpperCase(),
        market_type: marketType,
        direction,
        opened_at: new Date(openedAt).toISOString(),
        entry_price: parsedEntry,
        position_size: parsedSize,
        stop_loss: parsedSL,
        take_profit: parsedTP,
        risk_amount: parsedRisk,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka posisi trade.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <h3 className="text-base font-bold text-fg">Buka Posisi Trade Baru</h3>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account and Market Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="trade-acc" className="block text-xs font-medium text-fg mb-1">
                Akun Trading *
              </label>
              <select
                id="trade-acc"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="market-type" className="block text-xs font-medium text-fg mb-1">
                Kategori Pasar *
              </label>
              <select
                id="market-type"
                value={marketType}
                onChange={(e) => setMarketType(e.target.value as MarketType)}
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              >
                {MARKET_TYPES.map((mt) => (
                  <option key={mt.value} value={mt.value}>
                    {mt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Direction toggle: LONG (Buy) / SHORT (Sell) */}
          <div>
            <label className="block text-xs font-medium text-fg mb-1">
              Arah Posisi (Direction) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('long')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  direction === 'long'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-line bg-app text-muted hover:text-fg'
                }`}
              >
                ▲ LONG (BUY)
              </button>
              <button
                type="button"
                onClick={() => setDirection('short')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  direction === 'short'
                    ? 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 shadow-sm'
                    : 'border-line bg-app text-muted hover:text-fg'
                }`}
              >
                ▼ SHORT (SELL)
              </button>
            </div>
          </div>

          {/* Symbol & Position Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="trade-symbol" className="block text-xs font-medium text-fg mb-1">
                Simbol Aset / Pair *
              </label>
              <input
                id="trade-symbol"
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Misal: EURUSD, BTCUSDT, XAUUSD"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg font-mono uppercase focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="position-size" className="block text-xs font-medium text-fg mb-1">
                Ukuran Posisi (Lot / Kontrak) *
              </label>
              <input
                id="position-size"
                type="number"
                step="any"
                min="0.0001"
                required
                value={positionSize}
                onChange={(e) => setPositionSize(e.target.value)}
                placeholder="Contoh: 1.0 atau 0.05"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Entry Price & Opened At */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="entry-price" className="block text-xs font-medium text-fg mb-1">
                Harga Masuk (Entry Price) *
              </label>
              <input
                id="entry-price"
                type="number"
                step="any"
                min="0.00000001"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="Contoh: 1.08500"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="opened-at" className="block text-xs font-medium text-fg mb-1">
                Waktu Buka Posisi *
              </label>
              <input
                id="opened-at"
                type="datetime-local"
                required
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* SL, TP & Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="stop-loss" className="block text-xs font-medium text-fg mb-1">
                Stop Loss (SL)
              </label>
              <input
                id="stop-loss"
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Opsional"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="take-profit" className="block text-xs font-medium text-fg mb-1">
                Take Profit (TP)
              </label>
              <input
                id="take-profit"
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Opsional"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="risk-amount" className="block text-xs font-medium text-fg mb-1">
                Resiko ({selectedAccount?.currency || 'USD'})
              </label>
              <input
                id="risk-amount"
                type="number"
                step="any"
                value={riskAmount}
                onChange={(e) => setRiskAmount(e.target.value)}
                placeholder="Opsional"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Strategy selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="strategy-id" className="text-xs font-medium text-fg">
                Strategi Trading (Opsional)
              </label>
              <button
                type="button"
                onClick={() => setShowNewStrategy(!showNewStrategy)}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                {showNewStrategy ? 'Pilih yang ada' : '+ Buat Strategi Baru'}
              </button>
            </div>

            {showNewStrategy ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="Nama strategi, misal: Breakout EMA200"
                  className="block flex-1 rounded-lg border border-line bg-app py-1.5 px-3 text-xs text-fg focus:border-primary focus:outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddStrategy}
                  className="h-8 px-3 text-xs shrink-0"
                >
                  Tambah
                </Button>
              </div>
            ) : (
              <select
                id="strategy-id"
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
              >
                <option value="">Tanpa Strategi</option>
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="trade-notes" className="block text-xs font-medium text-fg mb-1">
              Catatan & Alasan Entry (Trading Plan)
            </label>
            <textarea
              id="trade-notes"
              rows={2}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Konfirmasi sinyal, level support/resistance, kondisi emosi..."
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-xs text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Membuka Posisi...' : 'Buka Posisi Trade'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
