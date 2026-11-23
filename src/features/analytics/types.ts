import type { Database } from '@/types/database'

export type PeriodFilterPreset =
  | 'all'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom'

export interface AnalyticsFilter {
  preset: PeriodFilterPreset
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  accountId?: string
}

export interface DateRange {
  from: string | null // ISO string or null
  to: string | null // ISO string or null
  label: string
}

export type SummaryData = Database['public']['Functions']['get_account_summary']['Returns'][number]
export type BalanceCurvePoint = Database['public']['Functions']['get_balance_curve']['Returns'][number]
export type MonthlyCurvePoint = Database['public']['Functions']['get_monthly_performance']['Returns'][number]
export type EquityCurvePoint = Database['public']['Functions']['get_equity_curve']['Returns'][number]

export interface DailyPerformancePoint {
  date: string
  formattedDate: string
  tradingPnl: number
  cumulativePnl: number
  balance: number
  tradesCount: number
}

export interface MonthlyPerformancePoint {
  month: string
  label: string
  netPnl: number
  wins: number
  losses: number
  breakevens: number
  winrate: number | null
  totalTrades: number
}

export interface AnnualPerformancePoint {
  year: string
  netPnl: number
  wins: number
  losses: number
  breakevens: number
  winrate: number | null
  totalTrades: number
}

export interface ProfitVsLossData {
  totalWinAmount: number
  totalLossAmount: number
  netPnl: number
  profitFactor: number | null
  avgWin: number | null
  avgLoss: number | null
}

export interface WinrateDistribution {
  wins: number
  losses: number
  breakevens: number
  winrate: number
  winPct: number
  lossPct: number
  breakevenPct: number
  totalClosed: number
}

export interface BalanceGrowthPoint {
  date: string
  balance: number
  cashFlow: number
  tradingPnl: number
}

export interface TradeExportItem {
  id: string
  accountName: string
  symbol: string
  marketType: string
  direction: string
  status: string
  openedAt: string
  closedAt: string | null
  entryPrice: number
  exitPrice: number | null
  size: number
  grossPnl: number | null
  netPnl: number | null
  result: string | null
  commission: number
  fee: number
  swap: number
  riskAmount: number | null
  notes: string | null
}
