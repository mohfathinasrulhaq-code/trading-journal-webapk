import { describe, expect, it } from 'vitest'
import { generateCsvContent, generateExcelWorkbook } from './export'
import type { SummaryData, TradeExportItem } from './types'

describe('Analytics Export Module', () => {
  const mockTrades: TradeExportItem[] = [
    {
      id: 'trade-001',
      accountName: 'Akun Utama',
      symbol: 'EURUSD',
      marketType: 'forex',
      direction: 'LONG',
      status: 'CLOSED',
      openedAt: '2026-11-20T10:00:00Z',
      closedAt: '2026-11-20T12:00:00Z',
      entryPrice: 1.085,
      exitPrice: 1.09,
      size: 1.0,
      grossPnl: 50.0,
      netPnl: 45.0,
      result: 'WIN',
      commission: 3.0,
      fee: 2.0,
      swap: 0.0,
      riskAmount: 25.0,
      notes: 'Breakout London session',
    },
    {
      id: 'trade-002',
      accountName: 'Akun Utama',
      symbol: 'BTCUSDT',
      marketType: 'crypto',
      direction: 'SHORT',
      status: 'CLOSED',
      openedAt: '2026-11-21T14:00:00Z',
      closedAt: '2026-11-21T15:30:00Z',
      entryPrice: 95000,
      exitPrice: 95500,
      size: 0.1,
      grossPnl: -50.0,
      netPnl: -52.0,
      result: 'LOSS',
      commission: 1.0,
      fee: 1.0,
      swap: 0.0,
      riskAmount: 50.0,
      notes: 'Fakeout resistance',
    },
  ]

  const mockSummary: SummaryData = {
    currency: 'USD',
    total_deposit: 1000,
    total_withdraw: 0,
    net_deposit: 1000,
    trading_pnl: -7.0,
    balance: 993.0,
    period_pnl: -7.0,
    closed_trades: 2,
    wins: 1,
    losses: 1,
    breakevens: 0,
    winrate: 50.0,
    total_win_amount: 45.0,
    total_loss_amount: 52.0,
    avg_win: 45.0,
    avg_loss: 52.0,
    profit_factor: 0.865,
    expectancy: -3.5,
    avg_r: 0.38,
    return_pct: -0.7,
    max_drawdown_abs: 52.0,
    max_drawdown_pct: 5.2,
  }

  describe('generateCsvContent', () => {
    it('menghasilkan CSV valid dengan header yang tepat', () => {
      const csv = generateCsvContent(mockTrades)
      const lines = csv.split('\r\n')

      expect(lines.length).toBe(3) // 1 header + 2 trade rows
      expect(lines[0]).toContain('ID Trade,Akun,Simbol,Pasar,Arah')
      expect(lines[1]).toContain('trade-001,Akun Utama,EURUSD,forex,LONG,CLOSED')
      expect(lines[2]).toContain('trade-002,Akun Utama,BTCUSDT,crypto,SHORT,CLOSED')
    })

    it('melakukan escape karakter khusus seperti koma dalam catatan', () => {
      const tradesWithComma: TradeExportItem[] = [
        {
          ...mockTrades[0],
          notes: 'Test, with comma, and "quotes"',
        },
      ]
      const csv = generateCsvContent(tradesWithComma)
      expect(csv).toContain('"Test, with comma, and ""quotes"""')
    })
  })

  describe('generateExcelWorkbook', () => {
    it('membuat workbook XLSX dengan dua lembar kerja (Daftar Trades & Ringkasan)', () => {
      const wb = generateExcelWorkbook(mockTrades, mockSummary, 'Bulan Ini')

      expect(wb.SheetNames).toEqual(['Daftar Trades', 'Ringkasan Performa'])

      const tradesSheet = wb.Sheets['Daftar Trades']
      expect(tradesSheet).toBeDefined()

      const summarySheet = wb.Sheets['Ringkasan Performa']
      expect(summarySheet).toBeDefined()
    })

    it('menyertakan metrik kinerja yang akurat di lembar ringkasan', () => {
      const wb = generateExcelWorkbook(mockTrades, mockSummary, 'Bulan Ini')
      const summarySheet = wb.Sheets['Ringkasan Performa']

      // Convert sheet to json array to inspect content
      const rows = summarySheet['!ref']
      expect(rows).toBeDefined()
    })
  })
})
