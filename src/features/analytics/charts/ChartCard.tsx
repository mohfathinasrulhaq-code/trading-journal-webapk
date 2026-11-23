import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  badge?: ReactNode
  isEmpty?: boolean
  emptyMessage?: string
}

export function ChartCard({
  title,
  subtitle,
  children,
  badge,
  isEmpty,
  emptyMessage = 'Belum ada data aktivitas trading pada periode ini.',
}: ChartCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        {badge && <div>{badge}</div>}
      </div>

      <div className="min-h-[260px] w-full flex items-center justify-center">
        {isEmpty ? (
          <div className="text-center py-10 px-4 text-xs text-muted">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  )
}
