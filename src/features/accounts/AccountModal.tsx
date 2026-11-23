import { useState, type FormEvent } from 'react'
import { AlertCircleIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import type { AccountType } from '@/types/database'
import type { CreateAccountInput } from './types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: CreateAccountInput) => Promise<void>
}

const COMMON_CURRENCIES = ['USD', 'IDR', 'EUR', 'GBP', 'JPY', 'AUD', 'SGD']

export function AccountModal({ isOpen, onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [broker, setBroker] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('real')
  const [currency, setCurrency] = useState('USD')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nama akun wajib diisi.')
      return
    }

    if (!/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
      setError('Mata uang harus 3 huruf kapital (contoh: USD, IDR).')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        broker,
        account_type: accountType,
        currency: currency.trim().toUpperCase(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan akun.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <h3 className="text-base font-bold text-fg">Tambah Akun Trading</h3>
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
          <div>
            <label htmlFor="acc-name" className="block text-xs font-medium text-fg mb-1.5">
              Nama Akun *
            </label>
            <input
              id="acc-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Akun Scalping ICMarkets"
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="acc-broker" className="block text-xs font-medium text-fg mb-1.5">
              Broker / Exchange (Opsional)
            </label>
            <input
              id="acc-broker"
              type="text"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              placeholder="Contoh: IC Markets / Exness / Binance"
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="acc-type" className="block text-xs font-medium text-fg mb-1.5">
                Jenis Akun
              </label>
              <select
                id="acc-type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg focus:border-primary focus:outline-none"
              >
                <option value="real">Real (Uang Asli)</option>
                <option value="demo">Demo / Prop Challenge</option>
              </select>
            </div>

            <div>
              <label htmlFor="acc-curr" className="block text-xs font-medium text-fg mb-1.5">
                Mata Uang *
              </label>
              <div className="flex gap-1.5">
                <select
                  id="acc-curr"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg focus:border-primary focus:outline-none"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
