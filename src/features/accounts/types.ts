import type { AccountType, TradingAccount } from '@/types/database'

export interface AccountWithBalance extends TradingAccount {
  balance: number
}

export interface CreateAccountInput {
  name: string
  broker?: string
  account_type: AccountType
  currency: string
}

export interface UpdateAccountInput {
  name?: string
  broker?: string
  is_archived?: boolean
}
