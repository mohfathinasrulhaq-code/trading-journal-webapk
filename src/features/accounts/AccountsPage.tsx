import { useEffect, useState } from 'react'
import { AlertCircleIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccountModal } from './AccountModal'
import { createAccount, deleteAccount, fetchAccountsWithBalance, updateAccount } from './api'
import type { AccountWithBalance, CreateAccountInput } from './types'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function loadAccounts() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAccountsWithBalance()
      setAccounts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat akun trading.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  async function handleCreateAccount(input: CreateAccountInput) {
    await createAccount(input)
    setSuccessMsg(`Akun "${input.name}" berhasil dibuat!`)
    setTimeout(() => setSuccessMsg(null), 3000)
    await loadAccounts()
  }

  async function handleToggleArchive(acc: AccountWithBalance) {
    try {
      await updateAccount(acc.id, { is_archived: !acc.is_archived })
      setSuccessMsg(`Status akun "${acc.name}" berhasil diperbarui.`)
      setTimeout(() => setSuccessMsg(null), 3000)
      await loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status arsip.')
    }
  }

  async function handleDeleteAccount(acc: AccountWithBalance) {
    if (!confirm(`Yakin ingin menghapus akun "${acc.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      await deleteAccount(acc.id)
      setSuccessMsg(`Akun "${acc.name}" berhasil dihapus.`)
      setTimeout(() => setSuccessMsg(null), 3000)
      await loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus akun.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Akun Trading"
          description="Kelola akun trading multi-broker (Real & Demo) dan pantau saldo berjalan."
        />
        <Button onClick={() => setIsModalOpen(true)} className="h-10 self-start sm:self-auto">
          + Tambah Akun Trading
        </Button>
      </div>

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

      {isLoading ? (
        <div className="text-center py-12 text-xs text-muted">Memuat daftar akun trading...</div>
      ) : accounts.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm font-semibold text-fg">Belum Ada Akun Trading</p>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Buat akun trading pertama Anda untuk mulai mencatat transaksi trade dan deposit/withdraw.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="mt-4">
            Buat Akun Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card key={acc.id} className="flex flex-col justify-between p-5 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-fg text-base">{acc.name}</h3>
                    {acc.broker && <p className="text-xs text-muted mt-0.5">{acc.broker}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        acc.account_type === 'real'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {acc.account_type}
                    </span>
                    <span className="rounded bg-app border border-line px-2 py-0.5 text-[10px] font-bold text-fg">
                      {acc.currency}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-app border border-line p-3">
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
                    Saldo Berjalan
                  </span>
                  <p className="text-xl font-extrabold text-fg mt-0.5">
                    {acc.balance.toLocaleString('id-ID', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-semibold text-muted">{acc.currency}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-3 text-xs">
                <span className="text-[11px] text-muted">
                  {acc.is_archived ? '📁 Diarsipkan' : '🟢 Aktif'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleArchive(acc)}
                    className="text-xs text-muted hover:text-fg underline cursor-pointer"
                  >
                    {acc.is_archived ? 'Pulihkan' : 'Arsipkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(acc)}
                    className="text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAccount}
      />
    </div>
  )
}
