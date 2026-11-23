import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BalanceGrowthPoint } from '../types'
import { ChartCard } from './ChartCard'

interface Props {
  data: BalanceGrowthPoint[]
  currency?: string
}

export function BalanceGrowthChart({ data, currency = 'USD' }: Props) {
  const isEmpty = data.length === 0

  return (
    <ChartCard
      title="Balance Growth Chart"
      subtitle="Pertumbuhan saldo akun gabungan dari setoran kas dan hasil trading."
      isEmpty={isEmpty}
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 15, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as BalanceGrowthPoint
                  return (
                    <div className="rounded-lg border border-line bg-surface p-2.5 shadow-lg text-xs space-y-1">
                      <p className="font-semibold text-fg">{pt.date}</p>
                      <p className="text-primary font-bold text-sm">
                        Saldo: {pt.balance.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {currency}
                      </p>
                      {pt.cashFlow !== 0 && (
                        <p className="text-[11px] text-muted">
                          Arus Kas: {pt.cashFlow > 0 ? '+' : ''}
                          {pt.cashFlow.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {currency}
                        </p>
                      )}
                      {pt.tradingPnl !== 0 && (
                        <p className="text-[11px] text-muted">
                          P/L Trading: {pt.tradingPnl > 0 ? '+' : ''}
                          {pt.tradingPnl.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {currency}
                        </p>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#balanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
