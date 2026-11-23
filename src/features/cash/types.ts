import type { CashTransaction, CashTransactionType } from '@/types/database'

export interface CreateCashInput {
  account_id: string
  type: CashTransactionType
  amount: number
  occurred_at: string
  note?: string | null
}

export interface CashTransactionWithAccount extends CashTransaction {
  account_name?: string
  account_currency?: string
}

export interface CashSummary {
  totalDeposit: number
  totalWithdraw: number
  netDeposit: number
  transactionCount: number
}
