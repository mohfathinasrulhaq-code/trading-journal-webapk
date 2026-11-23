export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountType = 'real' | 'demo'
export type MarketType = 'forex' | 'crypto' | 'stock' | 'index' | 'commodity' | 'other'
export type TradeDirection = 'long' | 'short'
export type TradeStatus = 'open' | 'closed'
export type TradeResult = 'win' | 'loss' | 'breakeven'
export type CashTransactionType = 'deposit' | 'withdraw'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trading_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          broker: string | null
          account_type: AccountType
          currency: string
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          broker?: string | null
          account_type?: AccountType
          currency: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          broker?: string | null
          account_type?: AccountType
          currency?: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          type: CashTransactionType
          amount: number
          occurred_at: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          type: CashTransactionType
          amount: number
          occurred_at: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          type?: CashTransactionType
          amount?: number
          occurred_at?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          id: string
          user_id: string
          account_id: string
          strategy_id: string | null
          symbol: string
          market_type: MarketType
          direction: TradeDirection
          status: TradeStatus
          opened_at: string
          closed_at: string | null
          entry_price: number
          exit_price: number | null
          position_size: number
          size?: number
          gross_pnl: number | null
          net_pnl: number | null
          result: TradeResult | null
          commission: number
          fee: number
          swap: number
          risk_amount: number | null
          stop_loss: number | null
          take_profit: number | null
          target_price?: number | null
          stop_loss_price?: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          strategy_id?: string | null
          symbol: string
          market_type: MarketType
          direction: TradeDirection
          status: TradeStatus
          opened_at: string
          closed_at?: string | null
          entry_price: number
          exit_price?: number | null
          position_size: number
          size?: number
          gross_pnl?: number | null
          commission?: number
          fee?: number
          swap?: number
          risk_amount?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          target_price?: number | null
          stop_loss_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          strategy_id?: string | null
          symbol?: string
          market_type?: MarketType
          direction?: TradeDirection
          status?: TradeStatus
          opened_at?: string
          closed_at?: string | null
          entry_price?: number
          exit_price?: number | null
          position_size?: number
          size?: number
          gross_pnl?: number | null
          commission?: number
          fee?: number
          swap?: number
          risk_amount?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          target_price?: number | null
          stop_loss_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_account_balance: {
        Args: {
          p_account_id: string
          p_to?: string | null
        }
        Returns: number
      }
      get_account_summary: {
        Args: {
          p_account_id: string
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          currency: string
          total_deposit: number
          total_withdraw: number
          net_deposit: number
          trading_pnl: number
          balance: number
          period_pnl: number
          closed_trades: number
          wins: number
          losses: number
          breakevens: number
          winrate: number | null
          total_win_amount: number
          total_loss_amount: number
          avg_win: number | null
          avg_loss: number | null
          profit_factor: number | null
          expectancy: number | null
          avg_r: number | null
          return_pct: number | null
          max_drawdown_abs: number | null
          max_drawdown_pct: number | null
        }[]
      }
      get_equity_curve: {
        Args: {
          p_account_id: string
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          point_no: number
          trade_id: string
          closed_at: string
          net_pnl: number
          cumulative_pnl: number
          peak_pnl: number
          drawdown_abs: number
          drawdown_pct: number | null
        }[]
      }
      get_balance_curve: {
        Args: {
          p_account_id: string
          p_from?: string | null
          p_to?: string | null
          p_tz?: string
        }
        Returns: {
          day: string
          cash_flow: number
          trading_pnl: number
          balance: number
        }[]
      }
      get_monthly_performance: {
        Args: {
          p_account_id: string
          p_from?: string | null
          p_to?: string | null
          p_tz?: string
        }
        Returns: {
          month_start: string
          closed_trades: number
          wins: number
          losses: number
          breakevens: number
          net_pnl: number
          winrate: number | null
        }[]
      }
      get_symbol_performance: {
        Args: {
          p_account_id: string
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          symbol: string
          closed_trades: number
          wins: number
          losses: number
          breakevens: number
          net_pnl: number
          winrate: number | null
        }[]
      }
    }
    Enums: {
      account_type: AccountType
      market_type: MarketType
      trade_direction: TradeDirection
      trade_status: TradeStatus
      trade_result: TradeResult
      cash_transaction_type: CashTransactionType
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type TradingAccount = Database['public']['Tables']['trading_accounts']['Row']
export type Strategy = Database['public']['Tables']['strategies']['Row']
export type CashTransaction = Database['public']['Tables']['cash_transactions']['Row']
export type Trade = Database['public']['Tables']['trades']['Row']
