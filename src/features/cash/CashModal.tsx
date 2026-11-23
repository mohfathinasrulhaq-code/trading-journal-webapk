import { useState, type FormEvent } from 'react'
import { AlertCircleIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import type { AccountWithBalance } from '@/features/accounts/types'
import type { CashTransactionType } from '@/types/database'
import type { CreateCashInput } from './types'

interface Props {
  isOpen: boolean
  accounts: AccountWithBalance[]
  defaultAccountId?: string
  onClose: () => void
  onSubmit: (input: CreateCashInput) => Promise<void>
}

export function CashModal({
  isOpen,
  accounts,
  defaultAccountId,
  onClose,
  onSubmit,
}: Props) {
  const [type, setType] = useState<CashTransactionType>('deposit')
  const [accountId, setAccountId] = useState(defaultAccountId || accounts[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
  })
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0]
  const parsedAmount = parseFloat(amount) || 0
  const currentBalance = selectedAccount?.balance ?? 0

  const projectedBalance =
    type === 'deposit'
      ? currentBalance + parsedAmount
      : currentBalance - parsedAmount

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!accountId) {
      setError('Pilih akun trading terlebih dahulu.')
      return
    }

    if (!parsedAmount || parsedAmount <= 0) {
      setError('Jumlah transaksi harus lebih besar dari 0.')
      return
    }

    if (type === 'withdraw' && parsedAmount > currentBalance) {
      setError(
        `Penarikan ditolak (IR-06): Jumlah penarikan (${parsedAmount.toLocaleString('id-ID')}) melebihi saldo berjalan akun (${currentBalance.toLocaleString('id-ID')}).`,
      )
      return
    }

    if (!occurredAt) {
      setError('Pilih tanggal dan waktu transaksi.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        account_id: accountId,
        type,
        amount: parsedAmount,
        occurred_at: new Date(occurredAt).toISOString(),
        note: note.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat transaksi kas.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <h3 className="text-base font-bold text-fg">Catat Transaksi Kas</h3>
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
          {/* Toggle Type: Deposit / Withdraw */}
          <div>
            <label className="block text-xs font-medium text-fg mb-1.5">
              Tipe Transaksi *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  type === 'deposit'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-line bg-app text-muted hover:text-fg'
                }`}
              >
                + Deposit (Setoran)
              </button>
              <button
                type="button"
                onClick={() => setType('withdraw')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  type === 'withdraw'
                    ? 'border-red-500 bg-red-500/15 text-red-600 dark:text-red-400 shadow-sm'
                    : 'border-line bg-app text-muted hover:text-fg'
                }`}
              >
                - Withdraw (Penarikan)
              </button>
            </div>
            <p className="text-[11px] text-muted mt-1">
              {type === 'deposit'
                ? 'Menambahkan modal ke saldo akun. Tidak memengaruhi winrate trading.'
                : 'Menarik modal dari akun. Saldo akun tidak boleh menjadi negatif (IR-06).'}
            </p>
          </div>

          {/* Account Selection */}
          <div>
            <label htmlFor="cash-acc" className="block text-xs font-medium text-fg mb-1.5">
              Akun Trading Tujuan *
            </label>
            <select
              id="cash-acc"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg focus:border-primary focus:outline-none"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency}) — Saldo: {acc.balance.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="cash-amount" className="block text-xs font-medium text-fg mb-1.5">
              Jumlah Transaksi ({selectedAccount?.currency || 'USD'}) *
            </label>
            <div className="relative">
              <input
                id="cash-amount"
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 500"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>
            {selectedAccount && parsedAmount > 0 && (
              <div
                className={`mt-1.5 text-[11px] flex items-center justify-between px-2 py-1 rounded bg-sunken ${
                  projectedBalance < 0 ? 'text-red-500 font-semibold' : 'text-muted'
                }`}
              >
                <span>Saldo saat ini: {currentBalance.toLocaleString('id-ID')}</span>
                <span>
                  Estimasi saldo:{' '}
                  <strong className={projectedBalance < 0 ? 'text-red-500' : 'text-fg'}>
                    {projectedBalance.toLocaleString('id-ID')}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Occurred At */}
          <div>
            <label htmlFor="cash-time" className="block text-xs font-medium text-fg mb-1.5">
              Waktu Transaksi *
            </label>
            <input
              id="cash-time"
              type="datetime-local"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg focus:border-primary focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="cash-note" className="block text-xs font-medium text-fg mb-1.5">
              Catatan / Referensi (Opsional)
            </label>
            <input
              id="cash-note"
              type="text"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Setoran modal awal via BCA"
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (type === 'withdraw' && parsedAmount > currentBalance)}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi Kas'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
