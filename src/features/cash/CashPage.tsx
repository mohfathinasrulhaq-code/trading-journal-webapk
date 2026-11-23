import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircleIcon, CashIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchAccountsWithBalance } from '@/features/accounts/api'
import type { AccountWithBalance } from '@/features/accounts/types'
import { createCashTransaction, deleteCashTransaction, fetchCashTransactions } from './api'
import { CashModal } from './CashModal'
import type { CashTransactionWithAccount, CreateCashInput } from './types'

export default function CashPage() {
  const [transactions, setTransactions] = useState<CashTransactionWithAccount[]>([])
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdraw'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [accs, txs] = await Promise.all([
        fetchAccountsWithBalance(),
        fetchCashTransactions(selectedAccountId !== 'all' ? selectedAccountId : undefined),
      ])
      setAccounts(accs)
      setTransactions(txs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data kas.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedAccountId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchNote = tx.note?.toLowerCase().includes(query)
        const matchAccount = tx.account_name?.toLowerCase().includes(query)
        if (!matchNote && !matchAccount) return false
      }
      return true
    })
  }, [transactions, typeFilter, searchQuery])

  const summary = useMemo(() => {
    let totalDeposit = 0
    let totalWithdraw = 0

    for (const tx of transactions) {
      if (tx.type === 'deposit') {
        totalDeposit += tx.amount
      } else {
        totalWithdraw += tx.amount
      }
    }

    return {
      totalDeposit,
      totalWithdraw,
      netDeposit: totalDeposit - totalWithdraw,
      transactionCount: transactions.length,
    }
  }, [transactions])

  async function handleCreateCash(input: CreateCashInput) {
    await createCashTransaction(input)
    setSuccessMsg(
      `${input.type === 'deposit' ? 'Deposit' : 'Withdraw'} sebesar ${input.amount.toLocaleString(
        'id-ID',
      )} berhasil dicatat!`,
    )
    setTimeout(() => setSuccessMsg(null), 3000)
    await loadData()
  }

  async function handleDeleteTransaction(tx: CashTransactionWithAccount) {
    if (
      !confirm(
        `Hapus transaksi ${tx.type.toUpperCase()} sebesar ${tx.account_currency} ${tx.amount.toLocaleString(
          'id-ID',
        )}? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return
    }

    try {
      await deleteCashTransaction(tx.id)
      setSuccessMsg('Transaksi kas berhasil dihapus.')
      setTimeout(() => setSuccessMsg(null), 3000)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus transaksi kas.')
    }
  }

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso)
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Kas & Mutasi Saldo"
          description="Pencatatan deposit dan withdraw akun trading. Arus kas dipisahkan dari trading sehingga tidak memengaruhi winrate (BR-01)."
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-10 self-start sm:self-auto shrink-0"
          disabled={accounts.length === 0}
        >
          <CashIcon className="h-4 w-4" />
          <span>+ Catat Transaksi Kas</span>
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium"
        >
          ✅ {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted">Total Deposit</p>
          <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
            +{summary.totalDeposit.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-muted">Arus modal masuk</span>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted">Total Withdraw</p>
          <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
            -{summary.totalWithdraw.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-muted">Arus modal keluar</span>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted">Net Deposit</p>
          <p
            className={`mt-1 text-lg font-bold ${
              summary.netDeposit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {summary.netDeposit >= 0 ? '+' : ''}
            {summary.netDeposit.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-muted">Deposit bersih tersimpan</span>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted">Total Mutasi Kas</p>
          <p className="mt-1 text-lg font-bold text-fg">{summary.transactionCount}</p>
          <span className="text-[10px] text-muted">Frekuensi transaksi</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Account */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="rounded-lg border border-line bg-app py-1.5 px-3 text-xs text-fg focus:border-primary focus:outline-none"
            >
              <option value="all">Semua Akun Trading</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>

            {/* Filter Type */}
            <div className="flex items-center rounded-lg border border-line bg-app p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-primary-soft text-primary' : 'text-muted hover:text-fg'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('deposit')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  typeFilter === 'deposit'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-muted hover:text-fg'
                }`}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('withdraw')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  typeFilter === 'withdraw'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'text-muted hover:text-fg'
                }`}
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Search query */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan / akun..."
              className="w-full rounded-lg border border-line bg-app py-1.5 px-3 text-xs text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Transactions List / Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-muted">Memuat mutasi kas...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <p className="text-sm font-semibold text-fg">Belum Ada Akun Trading</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Anda perlu membuat akun trading terlebih dahulu di halaman Akun sebelum mencatat kas.
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <p className="text-sm font-semibold text-fg">Belum Ada Mutasi Kas</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Catat deposit modal awal atau penarikan kas untuk akun trading Anda.'
                : 'Tidak ada transaksi kas yang cocok dengan filter yang dipilih.'}
            </p>
            {transactions.length === 0 && (
              <Button onClick={() => setIsModalOpen(true)} className="h-9 px-4 text-xs">
                + Catat Transaksi Kas Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-sunken/60 text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">Waktu Transaksi</th>
                  <th className="py-3 px-4 font-medium">Akun Trading</th>
                  <th className="py-3 px-4 font-medium">Tipe</th>
                  <th className="py-3 px-4 font-medium text-right">Jumlah</th>
                  <th className="py-3 px-4 font-medium">Catatan / Referensi</th>
                  <th className="py-3 px-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-sunken/40 transition-colors">
                    <td className="py-3 px-4 text-fg font-mono whitespace-nowrap">
                      {formatDateTime(tx.occurred_at)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-fg">{tx.account_name}</span>
                      <span className="ml-1.5 text-[11px] text-muted">({tx.account_currency})</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.type === 'deposit' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          + DEPOSIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
                          - WITHDRAW
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                        tx.type === 'deposit'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'deposit' ? '+' : '-'}
                      {tx.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-muted max-w-xs truncate">
                      {tx.note || <span className="italic text-muted/60">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx)}
                        className="rounded px-2 py-1 text-xs text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        title="Hapus transaksi"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cash Modal */}
      {isModalOpen && (
        <CashModal
          isOpen={isModalOpen}
          accounts={accounts}
          defaultAccountId={selectedAccountId !== 'all' ? selectedAccountId : accounts[0]?.id}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateCash}
        />
      )}
    </div>
  )
}
