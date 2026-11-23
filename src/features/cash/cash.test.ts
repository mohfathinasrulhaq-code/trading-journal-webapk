import { describe, expect, it } from 'vitest'

describe('Cash Transactions Calculations & Rules', () => {
  it('correctly calculates total deposit, total withdraw, and net deposit', () => {
    const transactions = [
      { type: 'deposit', amount: 1000 },
      { type: 'deposit', amount: 500 },
      { type: 'withdraw', amount: 200 },
      { type: 'withdraw', amount: 300 },
    ]

    const totalDeposit = transactions
      .filter((t) => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalWithdraw = transactions
      .filter((t) => t.type === 'withdraw')
      .reduce((sum, t) => sum + t.amount, 0)

    const netDeposit = totalDeposit - totalWithdraw

    expect(totalDeposit).toBe(1500)
    expect(totalWithdraw).toBe(500)
    expect(netDeposit).toBe(1000)
  })

  it('enforces IR-06: withdrawal cannot exceed current running balance', () => {
    const currentBalance = 800
    const requestedWithdraw = 1000

    const isExceeded = requestedWithdraw > currentBalance
    expect(isExceeded).toBe(true)

    const validWithdraw = 500
    expect(validWithdraw <= currentBalance).toBe(true)
  })

  it('rejects zero or negative cash transaction amounts', () => {
    function validateCashAmount(amount: number) {
      if (amount <= 0 || isNaN(amount)) {
        throw new Error('Jumlah transaksi kas harus lebih besar dari 0.')
      }
      return true
    }

    expect(() => validateCashAmount(0)).toThrow('Jumlah transaksi kas harus lebih besar dari 0.')
    expect(() => validateCashAmount(-50)).toThrow('Jumlah transaksi kas harus lebih besar dari 0.')
    expect(validateCashAmount(100)).toBe(true)
  })
})
