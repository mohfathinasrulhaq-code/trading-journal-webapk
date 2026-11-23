import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircleIcon, TradesIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { fetchAccountsWithBalance } from '@/features/accounts/api'
import type { AccountWithBalance } from '@/features/accounts/types'
import { closeTrade, createTrade, deleteTrade, fetchTrades } from './api'
import { CloseTradeModal } from './CloseTradeModal'
import { TradeModal } from './TradeModal'
import type {
  CloseTradeInput,
  CreateTradeInput,
  TradeWithDetails,
} from './types'

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeWithDetails[]>([])
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false)
  const [closingTrade, setClosingTrade] = useState<TradeWithDetails | null>(null)

  // Filters
  const [statusTab, setStatusTab] = useState<'all' | 'open' | 'closed'>('all')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [marketFilter, setMarketFilter] = useState<string>('all')
  const [directionFilter, setDirectionFilter] = useState<string>('all')
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [searchSymbol, setSearchSymbol] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [accs, tradeList] = await Promise.all([
        fetchAccountsWithBalance(),
        fetchTrades(
          selectedAccountId !== 'all' ? selectedAccountId : undefined,
          statusTab !== 'all' ? statusTab : undefined,
        ),
      ])
      setAccounts(accs)
      setTrades(tradeList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat catatan trade.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedAccountId, statusTab])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered trades based on client-side search/filters
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (searchSymbol.trim() && !t.symbol.toLowerCase().includes(searchSymbol.toLowerCase().trim())) {
        return false
      }
      if (marketFilter !== 'all' && t.market_type !== marketFilter) {
        return false
      }
      if (directionFilter !== 'all' && t.direction !== directionFilter) {
        return false
      }
      if (resultFilter !== 'all' && t.result !== resultFilter) {
        return false
      }
      return true
    })
  }, [trades, searchSymbol, marketFilter, directionFilter, resultFilter])

  // Summary Metrics
  const summary = useMemo(() => {
    let openCount = 0
    let closedCount = 0
    let netPnlTotal = 0
    let winCount = 0

    for (const t of trades) {
      if (t.status === 'open') {
        openCount++
      } else {
        closedCount++
        if (t.net_pnl !== null) {
          netPnlTotal += t.net_pnl
        }
        if (t.result === 'win') {
          winCount++
        }
      }
    }

    const winrate = closedCount > 0 ? (winCount / closedCount) * 100 : 0

    return {
      openCount,
      closedCount,
      netPnlTotal,
      winrate,
    }
  }, [trades])

  async function handleOpenTrade(input: CreateTradeInput) {
    await createTrade(input)
    setSuccessMsg(`Posisi ${input.direction.toUpperCase()} pada ${input.symbol} berhasil dibuka!`)
    setTimeout(() => setSuccessMsg(null), 3000)
    await loadData()
  }

  async function handleCloseTrade(id: string, input: CloseTradeInput) {
    await closeTrade(id, input)
    setSuccessMsg('Posisi trade berhasil ditutup!')
    setTimeout(() => setSuccessMsg(null), 3000)
    await loadData()
  }

  async function handleDeleteTrade(t: TradeWithDetails) {
    if (
      !confirm(
        `Hapus transaksi trade ${t.symbol} (${t.direction.toUpperCase()})? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return
    }

    try {
      await deleteTrade(t.id)
      setSuccessMsg(`Trade ${t.symbol} berhasil dihapus.`)
      setTimeout(() => setSuccessMsg(null), 3000)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus trade.')
    }
  }

  function formatDateTime(iso?: string | null) {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
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
          title="Jurnal Trades"
          description="Catat posisi trading, hitung otomatis Net P&L dan hasil Win/Loss/Breakeven sesuai aturan sistem (BR-01)."
        />
        <Button
          onClick={() => setIsOpenModalOpen(true)}
          className="h-10 self-start sm:self-auto shrink-0"
          disabled={accounts.length === 0}
        >
          <TradesIcon className="h-4 w-4" />
          <span>+ Buka Posisi Baru</span>
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
          <p className="text-[11px] font-medium text-muted">Posisi Aktif (Open)</p>
          <p className="mt-1 text-lg font-bold text-amber-500">{summary.openCount}</p>
          <span className="text-[10px] text-muted">Trade berjalan</span>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted">Trade Selesai</p>
          <p className="mt-1 text-lg font-bold text-fg">{summary.closedCount}</p>
          <span className="text-[10px] text-muted">Riwayat closed</span>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted">Net P&L Kumulatif</p>
          <p
            className={`mt-1 text-lg font-bold ${
              summary.netPnlTotal >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {summary.netPnlTotal >= 0 ? '+' : ''}
            {summary.netPnlTotal.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-muted">Keuntungan bersih</span>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-medium text-muted">Winrate</p>
          <p className="mt-1 text-lg font-bold text-fg">{summary.winrate.toFixed(1)}%</p>
          <span className="text-[10px] text-muted">Persentase menang</span>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex border-b border-line gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setStatusTab('all')}
            className={`pb-2.5 transition-colors border-b-2 -mb-px ${
              statusTab === 'all'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            Semua Trade ({trades.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('open')}
            className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              statusTab === 'open'
                ? 'border-amber-500 text-amber-500 font-bold'
                : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            <span>Posisi Terbuka</span>
            {summary.openCount > 0 && (
              <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 text-[10px]">
                {summary.openCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('closed')}
            className={`pb-2.5 transition-colors border-b-2 -mb-px ${
              statusTab === 'closed'
                ? 'border-emerald-500 text-emerald-500 font-bold'
                : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            Riwayat Selesai ({summary.closedCount})
          </button>
        </div>

        {/* Filters Toolbar */}
        <Card className="p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs">
            {/* Search Symbol */}
            <div>
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                placeholder="Cari simbol (EURUSD...)"
                className="w-full rounded-lg border border-line bg-app py-1.5 px-3 text-xs text-fg uppercase focus:border-primary focus:outline-none"
              />
            </div>

            {/* Account filter */}
            <div>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded-lg border border-line bg-app py-1.5 px-2.5 text-xs text-fg focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Akun</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Market filter */}
            <div>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-app py-1.5 px-2.5 text-xs text-fg focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Pasar</option>
                <option value="forex">Forex</option>
                <option value="crypto">Kripto</option>
                <option value="commodity">Komoditas</option>
                <option value="index">Indeks</option>
                <option value="stock">Saham</option>
              </select>
            </div>

            {/* Direction filter */}
            <div>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-app py-1.5 px-2.5 text-xs text-fg focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Arah</option>
                <option value="long">LONG (Buy)</option>
                <option value="short">SHORT (Sell)</option>
              </select>
            </div>

            {/* Result filter */}
            <div>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="w-full rounded-lg border border-line bg-app py-1.5 px-2.5 text-xs text-fg focus:border-primary focus:outline-none"
              >
                <option value="all">Semua Hasil</option>
                <option value="win">WIN</option>
                <option value="loss">LOSS</option>
                <option value="breakeven">BREAKEVEN</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Trades Table */}
      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-muted">Memuat jurnal trade...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <p className="text-sm font-semibold text-fg">Belum Ada Akun Trading</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Buat akun trading Anda terlebih dahulu di menu Akun sebelum mencatat transaksi.
            </p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <p className="text-sm font-semibold text-fg">Belum Ada Catatan Trade</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {trades.length === 0
                ? 'Mulai catat transaksi trading Anda untuk mengevaluasi kinerja dan kedisiplinan.'
                : 'Tidak ada data trade yang sesuai dengan kriteria filter.'}
            </p>
            {trades.length === 0 && (
              <Button onClick={() => setIsOpenModalOpen(true)} className="h-9 px-4 text-xs">
                + Buka Posisi Baru
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-sunken/60 text-muted">
                <tr>
                  <th className="py-3 px-4 font-medium">Aset & Pasar</th>
                  <th className="py-3 px-4 font-medium">Arah</th>
                  <th className="py-3 px-4 font-medium">Lot / Size</th>
                  <th className="py-3 px-4 font-medium">Entry & Exit</th>
                  <th className="py-3 px-4 font-medium">SL / TP</th>
                  <th className="py-3 px-4 font-medium text-right">Net P&L</th>
                  <th className="py-3 px-4 font-medium text-center">Hasil</th>
                  <th className="py-3 px-4 font-medium">Waktu (Buka/Tutup)</th>
                  <th className="py-3 px-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredTrades.map((t) => {
                  const isLong = t.direction === 'long'
                  const isOpen = t.status === 'open'
                  return (
                    <tr key={t.id} className="hover:bg-sunken/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-fg uppercase font-mono">{t.symbol}</div>
                        <div className="text-[10px] text-muted capitalize">
                          {t.market_type} • {t.account_name}
                        </div>
                        {t.strategy_name && (
                          <span className="inline-block mt-0.5 text-[10px] text-primary bg-primary-soft px-1.5 py-0.2 rounded">
                            {t.strategy_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                            isLong
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/15 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isLong ? '▲ LONG' : '▼ SHORT'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                        {t.position_size}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="text-fg">{t.entry_price}</div>
                        <div className="text-[11px] text-muted">
                          {isOpen ? (
                            <span className="text-amber-500 font-sans italic">Berjalan</span>
                          ) : (
                            t.exit_price
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div>SL: {t.stop_loss || '-'}</div>
                        <div>TP: {t.take_profit || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                        {isOpen ? (
                          <span className="text-muted italic">-</span>
                        ) : (
                          <div>
                            <span
                              className={`font-bold ${
                                (t.net_pnl ?? 0) >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {(t.net_pnl ?? 0) >= 0 ? '+' : ''}
                              {t.net_pnl?.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </span>
                            <div className="text-[10px] text-muted">
                              Biaya: {(t.commission + t.fee - t.swap).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isOpen ? (
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            OPEN
                          </span>
                        ) : t.result === 'win' ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            WIN
                          </span>
                        ) : t.result === 'loss' ? (
                          <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                            LOSS
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                            BE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-muted">
                        <div>Buka: {formatDateTime(t.opened_at)}</div>
                        <div>Tutup: {formatDateTime(t.closed_at)}</div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => setClosingTrade(t)}
                              className="rounded bg-primary-soft px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                            >
                              Tutup
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTrade(t)}
                            className="rounded px-2 py-1 text-xs text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Hapus trade"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {isOpenModalOpen && (
        <TradeModal
          isOpen={isOpenModalOpen}
          accounts={accounts}
          defaultAccountId={selectedAccountId !== 'all' ? selectedAccountId : accounts[0]?.id}
          onClose={() => setIsOpenModalOpen(false)}
          onSubmit={handleOpenTrade}
        />
      )}

      {closingTrade && (
        <CloseTradeModal
          isOpen={Boolean(closingTrade)}
          trade={closingTrade}
          onClose={() => setClosingTrade(null)}
          onSubmit={handleCloseTrade}
        />
      )}
    </div>
  )
}
