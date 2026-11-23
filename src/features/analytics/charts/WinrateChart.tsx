import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { WinrateDistribution } from '../types'
import { ChartCard } from './ChartCard'

interface Props {
  data: WinrateDistribution
}

export function WinrateChart({ data }: Props) {
  const chartData = [
    { name: 'Win', value: data.wins, color: '#10b981', pct: data.winPct },
    { name: 'Loss', value: data.losses, color: '#ef4444', pct: data.lossPct },
    { name: 'Breakeven', value: data.breakevens, color: '#6b7280', pct: data.breakevenPct },
  ].filter((d) => d.value > 0)

  const isEmpty = data.totalClosed === 0

  const badge = !isEmpty && (
    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      Winrate: {data.winrate.toFixed(1)}%
    </span>
  )

  return (
    <ChartCard
      title="Winrate Chart"
      subtitle="Distribusi rasio kemenangan, kekalahan, dan titik impas (Breakeven)."
      badge={badge}
      isEmpty={isEmpty}
    >
      <div className="flex flex-col sm:flex-row items-center justify-around h-[280px] w-full gap-4">
        <div className="relative h-[200px] w-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as { name: string; value: number; color: string; pct: number }
                    return (
                      <div className="rounded-lg border border-line bg-surface p-2 shadow-lg text-xs">
                        <p className="font-semibold text-fg">{item.name}</p>
                        <p style={{ color: item.color }} className="font-bold">
                          {item.value} trade ({item.pct.toFixed(1)}%)
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`pie-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-fg">{data.winrate.toFixed(0)}%</span>
            <span className="text-[10px] uppercase tracking-wider text-muted font-medium">Winrate</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 text-xs w-full max-w-[200px]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-app border border-line">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="font-medium text-fg">Wins</span>
            </div>
            <span className="font-bold text-fg">
              {data.wins} <span className="text-muted font-normal">({data.winPct.toFixed(0)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-app border border-line">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="font-medium text-fg">Losses</span>
            </div>
            <span className="font-bold text-fg">
              {data.losses} <span className="text-muted font-normal">({data.lossPct.toFixed(0)}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-app border border-line">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-gray-500" />
              <span className="font-medium text-fg">Breakeven</span>
            </div>
            <span className="font-bold text-fg">
              {data.breakevens} <span className="text-muted font-normal">({data.breakevenPct.toFixed(0)}%)</span>
            </span>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
