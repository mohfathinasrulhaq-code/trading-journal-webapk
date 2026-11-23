import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { TradingAccount } from '@/types/database'
import type { AnalyticsFilter, PeriodFilterPreset } from './types'

interface Props {
  accounts: TradingAccount[]
  currentFilter: AnalyticsFilter
  onFilterChange: (newFilter: AnalyticsFilter) => void
  onExportCsv: () => void
  onExportExcel: () => void
  isExporting: boolean
}

export function AnalyticsFilterBar({
  accounts,
  currentFilter,
  onFilterChange,
  onExportCsv,
  onExportExcel,
  isExporting,
}: Props) {
  const [customStart, setCustomStart] = useState(currentFilter.startDate || '')
  const [customEnd, setCustomEnd] = useState(currentFilter.endDate || '')

  const PRESETS: { id: PeriodFilterPreset; label: string }[] = [
    { id: 'all', label: 'Semua Waktu' },
    { id: 'this_month', label: 'Bulan Ini' },
    { id: 'last_month', label: 'Bulan Lalu' },
    { id: 'this_year', label: 'Tahun Ini' },
    { id: 'last_year', label: 'Tahun Lalu' },
    { id: 'custom', label: 'Kustom' },
  ]

  function handlePresetClick(preset: PeriodFilterPreset) {
    onFilterChange({
      ...currentFilter,
      preset,
      startDate: preset === 'custom' ? customStart : undefined,
      endDate: preset === 'custom' ? customEnd : undefined,
    })
  }

  function handleApplyCustom() {
    if (!customStart || !customEnd) return
    onFilterChange({
      ...currentFilter,
      preset: 'custom',
      startDate: customStart,
      endDate: customEnd,
    })
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Account Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="account-select" className="text-xs font-semibold text-muted whitespace-nowrap">
            Akun Trading:
          </label>
          <select
            id="account-select"
            value={currentFilter.accountId || ''}
            onChange={(e) => onFilterChange({ ...currentFilter, accountId: e.target.value })}
            className="rounded-lg border border-line bg-app px-3 py-1.5 text-xs text-fg focus:border-primary focus:outline-none"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Export */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={onExportCsv}
            disabled={isExporting}
            className="h-8 px-3 text-xs"
          >
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">CSV</span>
            <span>Ekspor CSV</span>
          </Button>

          <Button
            variant="secondary"
            onClick={onExportExcel}
            disabled={isExporting}
            className="h-8 px-3 text-xs"
          >
            <span className="font-semibold text-blue-600 dark:text-blue-400">XLSX</span>
            <span>Ekspor Excel</span>
          </Button>
        </div>
      </div>

      {/* Preset Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        {PRESETS.map((p) => {
          const isActive = currentFilter.preset === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetClick(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-fg shadow-sm'
                  : 'bg-app text-muted hover:bg-surface hover:text-fg border border-line'
              }`}
            >
              {p.label}
            </button>
          )
        })}

        {currentFilter.preset === 'custom' && (
          <div className="flex items-center gap-2 ml-auto mt-2 sm:mt-0 flex-wrap">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-line bg-app px-2.5 py-1 text-xs text-fg focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-muted">s.d.</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-line bg-app px-2.5 py-1 text-xs text-fg focus:border-primary focus:outline-none"
            />
            <Button
              variant="secondary"
              onClick={handleApplyCustom}
              className="h-7 px-2.5 text-xs"
            >
              Terapkan
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
