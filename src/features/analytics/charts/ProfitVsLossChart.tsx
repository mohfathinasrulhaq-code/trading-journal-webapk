import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ProfitVsLossData } from '../types'
import { ChartCard } from './ChartCard'

interface Props {
  data: ProfitVsLossData
  currency?: string
}

export function ProfitVsLossChart({ data, currency = 'USD' }: Props) {
  const chartData = [
    { name: 'Total Win', amount: data.totalWinAmount, color: '#10b981' },
    { name: 'Total Loss', amount: data.totalLossAmount, color: '#ef4444' },
    { name: 'Avg Win', amount: data.avgWin || 0, color: '#34d399' },
    { name: 'Avg Loss', amount: data.avgLoss || 0, color: '#f87171' },
  ]

  const isEmpty = data.totalWinAmount === 0 && data.totalLossAmount === 0

  const badge = data.profitFactor !== null && (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
      Profit Factor: {data.profitFactor.toFixed(2)}
    </span>
  )

  return (
    <ChartCard
      title="Profit vs Loss Chart"
      subtitle="Perbandingan total akumulasi keuntungan (Win) dan kerugian (Loss)."
      badge={badge}
      isEmpty={isEmpty}
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 15, left: -5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.8 }}
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
                  const item = payload[0].payload as { name: string; amount: number; color: string }
                  return (
                    <div className="rounded-lg border border-line bg-surface p-2.5 shadow-lg text-xs">
                      <p className="font-semibold text-fg mb-1">{item.name}</p>
                      <p style={{ color: item.color }} className="font-bold">
                        {item.amount.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {currency}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell key={`pvl-cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
