import { useEffect, useState, useTransition } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/useAuth'
import { fetchAnalyticsData, fetchTradesForExport, fetchUserAccounts } from '../analytics/api'
import { exportTradesToCsv, exportTradesToExcel } from '../analytics/export'
import { computeDateRange } from '../analytics/filters'
import { AnalyticsFilterBar } from '../analytics/AnalyticsFilterBar'
import { SummaryCards } from '../analytics/SummaryCards'
import { AnnualPerformanceChart } from '../analytics/charts/AnnualPerformanceChart'
import { BalanceGrowthChart } from '../analytics/charts/BalanceGrowthChart'
import { DailyPerformanceChart } from '../analytics/charts/DailyPerformanceChart'
import { MonthlyPerformanceChart } from '../analytics/charts/MonthlyPerformanceChart'
import { ProfitVsLossChart } from '../analytics/charts/ProfitVsLossChart'
import { WinrateChart } from '../analytics/charts/WinrateChart'
import type {
  AnalyticsFilter,
  AnnualPerformancePoint,
  BalanceGrowthPoint,
  DailyPerformancePoint,
  MonthlyPerformancePoint,
  ProfitVsLossData,
  SummaryData,
  WinrateDistribution,
} from '../analytics/types'
import type { TradingAccount } from '@/types/database'

export default function DashboardPage() {
  const { profile } = useAuth()
  const userTimezone = profile?.timezone || 'Asia/Jakarta'

  const [accounts, setAccounts] = useState<TradingAccount[]>([])
  const [filter, setFilter] = useState<AnalyticsFilter>({
    preset: 'all',
  })

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [dailyPoints, setDailyPoints] = useState<DailyPerformancePoint[]>([])
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPerformancePoint[]>([])
  const [annualPoints, setAnnualPoints] = useState<AnnualPerformancePoint[]>([])
  const [profitVsLoss, setProfitVsLoss] = useState<ProfitVsLossData>({
    totalWinAmount: 0,
    totalLossAmount: 0,
    netPnl: 0,
    profitFactor: null,
    avgWin: null,
    avgLoss: null,
  })
  const [winrateDist, setWinrateDist] = useState<WinrateDistribution>({
    wins: 0,
    losses: 0,
    breakevens: 0,
    winrate: 0,
    winPct: 0,
    lossPct: 0,
    breakevenPct: 0,
    totalClosed: 0,
  })
  const [balanceGrowth, setBalanceGrowth] = useState<BalanceGrowthPoint[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // 1. Initial Account Load
  useEffect(() => {
    fetchUserAccounts()
      .then((accs) => {
        setAccounts(accs)
        if (accs.length > 0 && !filter.accountId) {
          setFilter((prev) => ({ ...prev, accountId: accs[0].id }))
        }
      })
      .catch(() => {
        // Fallback demo account if accounts table is still empty
        const defaultAcc: TradingAccount = {
          id: 'demo-account-id',
          user_id: 'user',
          name: 'Akun Utama',
          broker: 'Demo',
          account_type: 'real',
          currency: 'USD',
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setAccounts([defaultAcc])
        setFilter((prev) => ({ ...prev, accountId: defaultAcc.id }))
      })
  }, [filter.accountId])

  // 2. Fetch Analytics when account or filter changes
  useEffect(() => {
    if (!filter.accountId) return

    const dateRange = computeDateRange(filter.preset, filter.startDate, filter.endDate)
    setIsLoading(true)

    fetchAnalyticsData(filter.accountId, dateRange, userTimezone)
      .then((res) => {
        startTransition(() => {
          setSummary(res.summary)
          setDailyPoints(res.dailyPoints)
          setMonthlyPoints(res.monthlyPoints)
          setAnnualPoints(res.annualPoints)
          setProfitVsLoss(res.profitVsLoss)
          setWinrateDist(res.winrateDist)
          setBalanceGrowth(res.balanceGrowth)
          setIsLoading(false)
        })
      })
      .catch(() => {
        // When database returns empty or unseeded, keep clean zero state
        setIsLoading(false)
      })
  }, [filter, userTimezone])

  const selectedAccount = accounts.find((a) => a.id === filter.accountId)
  const activeCurrency = summary?.currency || selectedAccount?.currency || 'USD'
  const dateRange = computeDateRange(filter.preset, filter.startDate, filter.endDate)

  async function handleExportCsv() {
    setIsExporting(true)
    setExportNotice(null)
    try {
      const trades = await fetchTradesForExport(filter.accountId, dateRange)
      exportTradesToCsv(trades, dateRange.label)
      setExportNotice(`Berhasil mengekspor ${trades.length} baris data ke file CSV.`)
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : 'Gagal mengekspor data.')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportExcel() {
    setIsExporting(true)
    setExportNotice(null)
    try {
      const trades = await fetchTradesForExport(filter.accountId, dateRange)
      exportTradesToExcel(trades, summary, dateRange.label)
      setExportNotice(`Berhasil mengekspor ${trades.length} baris data ke file Excel (.xlsx).`)
    } catch (err) {
      setExportNotice(err instanceof Error ? err.message : 'Gagal mengekspor data.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard & Analytics"
        description="Analisis performa trading, kurva saldo, rasio kemenangan, dan ekspor laporan berkala."
      />

      {/* Filter and Export Bar */}
      <AnalyticsFilterBar
        accounts={accounts}
        currentFilter={filter}
        onFilterChange={setFilter}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
      />

      {exportNotice && (
        <div
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs text-primary font-medium flex items-center justify-between"
        >
          <span>{exportNotice}</span>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="hover:opacity-75 cursor-pointer font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <SummaryCards summary={summary} currency={activeCurrency} />

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Row 1: Daily Performance & Balance Growth */}
        <DailyPerformanceChart data={dailyPoints} currency={activeCurrency} />
        <BalanceGrowthChart data={balanceGrowth} currency={activeCurrency} />

        {/* Row 2: Monthly Performance & Annual Performance */}
        <MonthlyPerformanceChart data={monthlyPoints} currency={activeCurrency} />
        <AnnualPerformanceChart data={annualPoints} currency={activeCurrency} />

        {/* Row 3: Profit vs Loss & Winrate Distribution */}
        <ProfitVsLossChart data={profitVsLoss} currency={activeCurrency} />
        <WinrateChart data={winrateDist} />
      </div>

      {isLoading && (
        <div className="text-center py-2 text-xs text-muted">
          Memperbarui data analitik...
        </div>
      )}
    </div>
  )
}
