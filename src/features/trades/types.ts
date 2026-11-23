import type {
  MarketType,
  Trade,
  TradeDirection,
} from '@/types/database'

export interface CreateTradeInput {
  account_id: string
  strategy_id?: string | null
  symbol: string
  market_type: MarketType
  direction: TradeDirection
  opened_at: string
  entry_price: number
  position_size: number
  stop_loss?: number | null
  take_profit?: number | null
  risk_amount?: number | null
  notes?: string | null
}

export interface CloseTradeInput {
  exit_price: number
  closed_at: string
  gross_pnl: number
  commission?: number
  fee?: number
  swap?: number
  notes?: string | null
}

export interface TradeWithDetails extends Trade {
  account_name?: string
  account_currency?: string
  strategy_name?: string
}

export interface StrategyItem {
  id: string
  user_id: string
  name: string
  description?: string | null
  created_at: string
}

export interface TradeFilters {
  accountId: string
  status: 'all' | 'open' | 'closed'
  marketType: string
  direction: string
  result: string
  symbolQuery: string
}
