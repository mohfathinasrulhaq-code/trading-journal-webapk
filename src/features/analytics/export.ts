import * as XLSX from 'xlsx'
import type { SummaryData, TradeExportItem } from './types'

export function generateCsvContent(trades: TradeExportItem[]): string {
  const headers = [
    'ID Trade',
    'Akun',
    'Simbol',
    'Pasar',
    'Arah',
    'Status',
    'Waktu Buka',
    'Waktu Tutup',
    'Harga Masuk',
    'Harga Keluar',
    'Ukuran',
    'Gross P/L',
    'Komisi',
    'Biaya',
    'Swap',
    'Net P/L',
    'Hasil',
    'Jumlah Risiko',
    'Catatan',
  ]

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const rows = trades.map((t) => [
    escapeCsv(t.id),
    escapeCsv(t.accountName),
    escapeCsv(t.symbol),
    escapeCsv(t.marketType),
    escapeCsv(t.direction),
    escapeCsv(t.status),
    escapeCsv(t.openedAt),
    escapeCsv(t.closedAt || '-'),
    escapeCsv(t.entryPrice),
    escapeCsv(t.exitPrice ?? '-'),
    escapeCsv(t.size),
    escapeCsv(t.grossPnl ?? '-'),
    escapeCsv(t.commission),
    escapeCsv(t.fee),
    escapeCsv(t.swap),
    escapeCsv(t.netPnl ?? '-'),
    escapeCsv(t.result || '-'),
    escapeCsv(t.riskAmount ?? '-'),
    escapeCsv(t.notes || ''),
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
}

export function exportTradesToCsv(trades: TradeExportItem[], filterLabel: string) {
  const csvContent = generateCsvContent(trades)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const filename = generateFilename('csv', filterLabel)
  downloadBlob(blob, filename)
}

export function generateExcelWorkbook(
  trades: TradeExportItem[],
  summary: SummaryData | null,
  filterLabel: string,
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Daftar Trades
  const tradesData = trades.map((t) => ({
    'ID Trade': t.id,
    'Akun': t.accountName,
    'Simbol': t.symbol,
    'Pasar': t.marketType,
    'Arah': t.direction,
    'Status': t.status,
    'Waktu Buka': t.openedAt,
    'Waktu Tutup': t.closedAt || '-',
    'Harga Masuk': t.entryPrice,
    'Harga Keluar': t.exitPrice ?? '-',
    'Ukuran': t.size,
    'Gross P/L': t.grossPnl ?? 0,
    'Komisi': t.commission,
    'Biaya': t.fee,
    'Swap': t.swap,
    'Net P/L': t.netPnl ?? 0,
    'Hasil': t.result || '-',
    'Jumlah Risiko': t.riskAmount ?? '-',
    'Catatan': t.notes || '',
  }))

  const wsTrades = XLSX.utils.json_to_sheet(tradesData)
  XLSX.utils.book_append_sheet(wb, wsTrades, 'Daftar Trades')

  // Sheet 2: Ringkasan & Filter
  const summaryRows = [
    { Parameter: 'Filter Waktu', Nilai: filterLabel },
    { Parameter: 'Tanggal Ekspor', Nilai: new Date().toLocaleString('id-ID') },
    { Parameter: 'Total Baris Trade', Nilai: trades.length },
    { Parameter: 'Mata Uang Akun', Nilai: summary?.currency || 'USD' },
    { Parameter: 'Saldo Akhir', Nilai: summary ? Number(summary.balance) : 0 },
    { Parameter: 'Total Deposit', Nilai: summary ? Number(summary.total_deposit) : 0 },
    { Parameter: 'Total Withdraw', Nilai: summary ? Number(summary.total_withdraw) : 0 },
    { Parameter: 'Net Deposit', Nilai: summary ? Number(summary.net_deposit) : 0 },
    { Parameter: 'P/L Periode Terpilih', Nilai: summary ? Number(summary.period_pnl) : 0 },
    { Parameter: 'Jumlah Trade Ditutup', Nilai: summary ? Number(summary.closed_trades) : 0 },
    { Parameter: 'Trade Win', Nilai: summary ? Number(summary.wins) : 0 },
    { Parameter: 'Trade Loss', Nilai: summary ? Number(summary.losses) : 0 },
    { Parameter: 'Trade Breakeven', Nilai: summary ? Number(summary.breakevens) : 0 },
    {
      Parameter: 'Winrate (%)',
      Nilai: summary && summary.winrate !== null ? `${Number(summary.winrate).toFixed(2)}%` : 'N/A',
    },
    { Parameter: 'Total Keuntungan (Win)', Nilai: summary ? Number(summary.total_win_amount) : 0 },
    { Parameter: 'Total Kerugian (Loss)', Nilai: summary ? Number(summary.total_loss_amount) : 0 },
    {
      Parameter: 'Profit Factor',
      Nilai: summary && summary.profit_factor !== null ? Number(summary.profit_factor).toFixed(2) : 'N/A',
    },
    {
      Parameter: 'Expectancy',
      Nilai: summary && summary.expectancy !== null ? Number(summary.expectancy).toFixed(2) : 'N/A',
    },
    {
      Parameter: 'Rata-rata R-Multiple',
      Nilai: summary && summary.avg_r !== null ? Number(summary.avg_r).toFixed(2) : 'N/A',
    },
    {
      Parameter: 'Return Kumulatif (%)',
      Nilai: summary && summary.return_pct !== null ? `${Number(summary.return_pct).toFixed(2)}%` : 'N/A',
    },
    {
      Parameter: 'Max Drawdown Absolut',
      Nilai: summary && summary.max_drawdown_abs !== null ? Number(summary.max_drawdown_abs) : 0,
    },
    {
      Parameter: 'Max Drawdown (%)',
      Nilai:
        summary && summary.max_drawdown_pct !== null
          ? `${Number(summary.max_drawdown_pct).toFixed(2)}%`
          : 'N/A',
    },
  ]

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Performa')

  return wb
}

export function exportTradesToExcel(
  trades: TradeExportItem[],
  summary: SummaryData | null,
  filterLabel: string,
) {
  const wb = generateExcelWorkbook(trades, summary, filterLabel)
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const filename = generateFilename('xlsx', filterLabel)
  downloadBlob(blob, filename)
}

function generateFilename(extension: 'csv' | 'xlsx', filterLabel: string): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '')
  const safeLabel = filterLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `trading_journal_${safeLabel}_${dateStr}_${timeStr}.${extension}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
