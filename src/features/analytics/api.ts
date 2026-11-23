import { getSupabase } from '@/lib/supabase'
import type { TradingAccount } from '@/types/database'
import type {
  AnnualPerformancePoint,
  BalanceGrowthPoint,
  DailyPerformancePoint,
  DateRange,
  MonthlyPerformancePoint,
  ProfitVsLossData,
  SummaryData,
  TradeExportItem,
  WinrateDistribution,
} from './types'

export async function fetchUserAccounts(): Promise<TradingAccount[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error('Gagal memuat akun trading: ' + error.message)
  }
  return data || []
}

export async function fetchAnalyticsData(
  accountId: string,
  range: DateRange,
  userTimezone = 'Asia/Jakarta',
) {
  const supabase = getSupabase()

  // 1. Account Summary
  const summaryPromise = supabase.rpc('get_account_summary', {
    p_account_id: accountId,
    p_from: range.from,
    p_to: range.to,
  })

  // 2. Balance Curve (daily)
  const balancePromise = supabase.rpc('get_balance_curve', {
    p_account_id: accountId,
    p_from: range.from,
    p_to: range.to,
    p_tz: userTimezone,
  })

  // 3. Monthly Performance
  const monthlyPromise = supabase.rpc('get_monthly_performance', {
    p_account_id: accountId,
    p_from: range.from,
    p_to: range.to,
    p_tz: userTimezone,
  })

  const [summaryRes, balanceRes, monthlyRes] = await Promise.all([
    summaryPromise,
    balancePromise,
    monthlyPromise,
  ])

  if (summaryRes.error) {
    throw new Error('Gagal memuat ringkasan performa: ' + summaryRes.error.message)
  }

  const rawSummary: SummaryData | null = summaryRes.data?.[0] ?? null
  const rawBalance = balanceRes.data ?? []
  const rawMonthly = monthlyRes.data ?? []

  // Transform Daily Performance & Balance Growth
  const dailyPoints: DailyPerformancePoint[] = []
  const balanceGrowth: BalanceGrowthPoint[] = []
  let cumulativePnl = 0

  for (const row of rawBalance) {
    const pnl = Number(row.trading_pnl || 0)
    cumulativePnl += pnl

    dailyPoints.push({
      date: row.day,
      formattedDate: formatDateLabel(row.day),
      tradingPnl: pnl,
      cumulativePnl,
      balance: Number(row.balance || 0),
      tradesCount: pnl !== 0 ? 1 : 0,
    })

    balanceGrowth.push({
      date: row.day,
      balance: Number(row.balance || 0),
      cashFlow: Number(row.cash_flow || 0),
      tradingPnl: pnl,
    })
  }

  // Transform Monthly Performance
  const monthlyPoints: MonthlyPerformancePoint[] = rawMonthly.map((row) => {
    const wins = Number(row.wins || 0)
    const losses = Number(row.losses || 0)
    const breakevens = Number(row.breakevens || 0)
    const totalTrades = Number(row.closed_trades || 0)
    const winrate = row.winrate !== null ? Number(row.winrate) : null

    return {
      month: row.month_start,
      label: formatMonthLabel(row.month_start),
      netPnl: Number(row.net_pnl || 0),
      wins,
      losses,
      breakevens,
      winrate,
      totalTrades,
    }
  })

  // Aggregate Annual Performance from monthly data
  const annualMap = new Map<string, AnnualPerformancePoint>()
  for (const m of monthlyPoints) {
    const year = m.month.substring(0, 4)
    const existing = annualMap.get(year) || {
      year,
      netPnl: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winrate: null,
      totalTrades: 0,
    }

    existing.netPnl += m.netPnl
    existing.wins += m.wins
    existing.losses += m.losses
    existing.breakevens += m.breakevens
    existing.totalTrades += m.totalTrades

    const winLossTotal = existing.wins + existing.losses
    existing.winrate = winLossTotal > 0 ? (existing.wins / winLossTotal) * 100 : null

    annualMap.set(year, existing)
  }
  const annualPoints = Array.from(annualMap.values()).sort((a, b) => a.year.localeCompare(b.year))

  // Profit vs Loss Data
  const profitVsLoss: ProfitVsLossData = {
    totalWinAmount: Number(rawSummary?.total_win_amount || 0),
    totalLossAmount: Number(rawSummary?.total_loss_amount || 0),
    netPnl: Number(rawSummary?.period_pnl || 0),
    profitFactor: rawSummary?.profit_factor !== null ? Number(rawSummary?.profit_factor) : null,
    avgWin: rawSummary?.avg_win !== null ? Number(rawSummary?.avg_win) : null,
    avgLoss: rawSummary?.avg_loss !== null ? Number(rawSummary?.avg_loss) : null,
  }

  // Winrate Distribution
  const wins = Number(rawSummary?.wins || 0)
  const losses = Number(rawSummary?.losses || 0)
  const breakevens = Number(rawSummary?.breakevens || 0)
  const totalClosed = Number(rawSummary?.closed_trades || 0)
  const winrate = rawSummary?.winrate !== null ? Number(rawSummary?.winrate) : 0

  const winPct = totalClosed > 0 ? (wins / totalClosed) * 100 : 0
  const lossPct = totalClosed > 0 ? (losses / totalClosed) * 100 : 0
  const breakevenPct = totalClosed > 0 ? (breakevens / totalClosed) * 100 : 0

  const winrateDist: WinrateDistribution = {
    wins,
    losses,
    breakevens,
    winrate,
    winPct,
    lossPct,
    breakevenPct,
    totalClosed,
  }

  return {
    summary: rawSummary,
    dailyPoints,
    monthlyPoints,
    annualPoints,
    profitVsLoss,
    winrateDist,
    balanceGrowth,
  }
}

export async function fetchTradesForExport(
  accountId?: string,
  range?: DateRange,
): Promise<TradeExportItem[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('trades')
    .select('*, trading_accounts(name)')
    .order('opened_at', { ascending: false })

  if (accountId && accountId !== 'all') {
    query = query.eq('account_id', accountId)
  }

  if (range?.from) {
    query = query.gte('opened_at', range.from)
  }

  if (range?.to) {
    query = query.lt('opened_at', range.to)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Gagal mengambil data trade untuk ekspor: ' + error.message)
  }

  return (data || []).map((t) => {
    const acc = t.trading_accounts as { name?: string } | null
    return {
      id: t.id,
      accountName: acc?.name || 'Utama',
      symbol: t.symbol,
      marketType: t.market_type,
      direction: t.direction.toUpperCase(),
      status: t.status.toUpperCase(),
      openedAt: t.opened_at,
      closedAt: t.closed_at,
      entryPrice: Number(t.entry_price),
      exitPrice: t.exit_price !== null ? Number(t.exit_price) : null,
      size: Number(t.position_size ?? t.size ?? 0),
      grossPnl: t.gross_pnl !== null ? Number(t.gross_pnl) : null,
      netPnl: t.net_pnl !== null ? Number(t.net_pnl) : null,
      result: t.result ? t.result.toUpperCase() : null,
      commission: Number(t.commission),
      fee: Number(t.fee),
      swap: Number(t.swap),
      riskAmount: t.risk_amount !== null ? Number(t.risk_amount) : null,
      notes: t.notes,
    }
  })
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return dateStr
  }
}

function formatMonthLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}
