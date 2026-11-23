import type { DateRange, PeriodFilterPreset } from './types'

export function computeDateRange(
  preset: PeriodFilterPreset,
  customStart?: string,
  customEnd?: string,
): DateRange {
  const now = new Date()

  if (preset === 'this_month') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0))
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: 'Bulan Ini',
    }
  }

  if (preset === 'last_month') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0))
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: 'Bulan Lalu',
    }
  }

  if (preset === 'this_year') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0))
    const to = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1, 0, 0, 0))
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: 'Tahun Ini',
    }
  }

  if (preset === 'last_year') {
    const from = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1, 0, 0, 0))
    const to = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0))
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: 'Tahun Lalu',
    }
  }

  if (preset === 'custom' && customStart && customEnd) {
    const [sYear, sMonth, sDay] = customStart.split('-').map(Number)
    const [eYear, eMonth, eDay] = customEnd.split('-').map(Number)

    const from = new Date(Date.UTC(sYear, sMonth - 1, sDay, 0, 0, 0))
    // Half-open interval: upper bound is exclusive, so add 1 day
    const to = new Date(Date.UTC(eYear, eMonth - 1, eDay + 1, 0, 0, 0))

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: `${customStart} s.d. ${customEnd}`,
    }
  }

  return {
    from: null,
    to: null,
    label: 'Semua Waktu',
  }
}
