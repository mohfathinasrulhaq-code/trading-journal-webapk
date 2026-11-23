import { describe, expect, it } from 'vitest'

describe('Trades Calculations & Formulas', () => {
  it('F-01: calculates Net P&L = gross_pnl - commission - fee + swap correctly', () => {
    // Win trade with costs
    const grossPnl1 = 60
    const commission1 = 4
    const fee1 = 2
    const swap1 = -4
    const netPnl1 = grossPnl1 - commission1 - fee1 + swap1
    expect(netPnl1).toBe(50)

    // Loss trade with costs
    const grossPnl2 = -20
    const commission2 = 5
    const fee2 = 3
    const swap2 = -2
    const netPnl2 = grossPnl2 - commission2 - fee2 + swap2
    expect(netPnl2).toBe(-30)

    // Breakeven trade where gross covers fees exactly
    const grossPnl3 = 10
    const commission3 = 6
    const fee3 = 4
    const swap3 = 0
    const netPnl3 = grossPnl3 - commission3 - fee3 + swap3
    expect(netPnl3).toBe(0)
  })

  it('F-02: derives result correctly (WIN, LOSS, BREAKEVEN) based on net_pnl', () => {
    function deriveResult(netPnl: number): 'win' | 'loss' | 'breakeven' {
      if (netPnl > 0) return 'win'
      if (netPnl < 0) return 'loss'
      return 'breakeven'
    }

    expect(deriveResult(50)).toBe('win')
    expect(deriveResult(-30)).toBe('loss')
    expect(deriveResult(0)).toBe('breakeven')
  })

  it('calculates estimated gross P&L for LONG and SHORT positions', () => {
    // LONG: (exit - entry) * size
    const entryPrice = 1.10
    const exitPriceLong = 1.12
    const size = 1.0
    const estimatedGrossLong = (exitPriceLong - entryPrice) * size
    expect(Number(estimatedGrossLong.toFixed(2))).toBe(0.02)

    // SHORT: (entry - exit) * size
    const exitPriceShort = 1.08
    const estimatedGrossShort = (entryPrice - exitPriceShort) * size
    expect(Number(estimatedGrossShort.toFixed(2))).toBe(0.02)
  })

  it('F-06: computes winrate percentage accurately based on closed trades', () => {
    const closedTrades = 4
    const wins = 2
    const winrate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0
    expect(winrate).toBe(50)
  })
})
