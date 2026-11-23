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
import type { AnnualPerformancePoint } from '../types'
import { ChartCard } from './ChartCard'

interface Props {
  data: AnnualPerformancePoint[]
  currency?: string
}

export function AnnualPerformanceChart({ data, currency = 'USD' }: Props) {
  const isEmpty = data.length === 0

  return (
    <ChartCard
      title="Annual Performance Chart"
      subtitle="Hasil kumulatif tahunan untuk evaluasi konsistensi jangka panjang."
      isEmpty={isEmpty}
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis
              dataKey="year"
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
                  const pt = payload[0].payload as AnnualPerformancePoint
                  const isPositive = pt.netPnl >= 0
                  return (
                    <div className="rounded-lg border border-line bg-surface p-2.5 shadow-lg text-xs space-y-1">
                      <p className="font-semibold text-fg">Tahun {pt.year}</p>
                      <p className={isPositive ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                        Net P/L: {isPositive ? '+' : ''}
                        {pt.netPnl.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {currency}
                      </p>
                      <div className="flex gap-2 text-[11px] text-muted">
                        <span>Win: {pt.wins}</span>
                        <span>Loss: {pt.losses}</span>
                        <span>BE: {pt.breakevens}</span>
                      </div>
                      <p className="text-[11px] text-muted">
                        Winrate: {pt.winrate !== null ? `${pt.winrate.toFixed(1)}%` : 'N/A'} ({pt.totalTrades} trade)
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="netPnl" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-y-${index}`}
                  fill={entry.netPnl >= 0 ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
