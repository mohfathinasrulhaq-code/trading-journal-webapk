import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyPerformancePoint } from '../types'
import { ChartCard } from './ChartCard'

interface Props {
  data: DailyPerformancePoint[]
  currency?: string
}

export function DailyPerformanceChart({ data, currency = 'USD' }: Props) {
  const isEmpty = data.length === 0

  return (
    <ChartCard
      title="Daily Performance Chart"
      subtitle="Performa laba/rugi bersih (Net P/L) per hari aktivitas trading."
      isEmpty={isEmpty}
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis
              dataKey="formattedDate"
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
            <ReferenceLine y={0} stroke="currentColor" opacity={0.3} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as DailyPerformancePoint
                  const isPositive = pt.tradingPnl >= 0
                  return (
                    <div className="rounded-lg border border-line bg-surface p-2.5 shadow-lg text-xs">
                      <p className="font-semibold text-fg mb-1">{pt.date}</p>
                      <p className={isPositive ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                        P/L: {isPositive ? '+' : ''}
                        {pt.tradingPnl.toLocaleString('id-ID', { minimumFractionDigits: 2 })}{' '}
                        {currency}
                      </p>
                      <p className="text-muted mt-0.5">
                        Saldo Akhir Hari: {pt.balance.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {currency}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="tradingPnl" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.tradingPnl >= 0 ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
