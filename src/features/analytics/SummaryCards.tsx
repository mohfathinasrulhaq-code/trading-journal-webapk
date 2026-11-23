import { Card } from '@/components/ui/Card'
import type { SummaryData } from './types'

interface Props {
  summary: SummaryData | null
  currency?: string
}

export function SummaryCards({ summary, currency = 'USD' }: Props) {
  const balance = summary ? Number(summary.balance) : 0
  const periodPnl = summary ? Number(summary.period_pnl) : 0
  const winrate = summary && summary.winrate !== null ? Number(summary.winrate) : null
  const profitFactor = summary && summary.profit_factor !== null ? Number(summary.profit_factor) : null
  const closedTrades = summary ? Number(summary.closed_trades) : 0
  const maxDd = summary && summary.max_drawdown_pct !== null ? Number(summary.max_drawdown_pct) : null

  const isPnlPositive = periodPnl >= 0

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Card className="p-3.5">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Saldo Akun</span>
        <p className="mt-1 text-base sm:text-lg font-bold text-fg truncate">
          {balance.toLocaleString('id-ID', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-muted">{currency}</span>
        </p>
      </Card>

      <Card className="p-3.5">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">P/L Periode</span>
        <p className={`mt-1 text-base sm:text-lg font-bold truncate ${isPnlPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPnlPositive ? '+' : ''}
          {periodPnl.toLocaleString('id-ID', { minimumFractionDigits: 2 })} <span className="text-xs font-normal opacity-80">{currency}</span>
        </p>
      </Card>

      <Card className="p-3.5">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Winrate</span>
        <p className="mt-1 text-base sm:text-lg font-bold text-fg truncate">
          {winrate !== null ? `${winrate.toFixed(1)}%` : 'N/A'}
        </p>
      </Card>

      <Card className="p-3.5">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Profit Factor</span>
        <p className="mt-1 text-base sm:text-lg font-bold text-fg truncate">
          {profitFactor !== null ? profitFactor.toFixed(2) : 'N/A'}
        </p>
      </Card>

      <Card className="p-3.5">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Max Drawdown</span>
        <p className="mt-1 text-base sm:text-lg font-bold text-fg truncate">
          {maxDd !== null ? `${maxDd.toFixed(1)}%` : '0.0%'}
        </p>
      </Card>

      <Card className="p-3.5">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Total Trades</span>
        <p className="mt-1 text-base sm:text-lg font-bold text-fg truncate">
          {closedTrades}
        </p>
      </Card>
    </div>
  )
}
