import { enqueueOfflineAction } from '@/lib/offlineSyncQueue'
import { getSupabase } from '@/lib/supabase'
import type { CloseTradeInput, CreateTradeInput, StrategyItem, TradeWithDetails } from './types'

export async function fetchTrades(
  accountId?: string,
  status?: 'all' | 'open' | 'closed',
): Promise<TradeWithDetails[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('trades')
    .select('*, trading_accounts(name, currency), strategies(name)')
    .order('opened_at', { ascending: false })

  if (accountId && accountId !== 'all') {
    query = query.eq('account_id', accountId)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Gagal memuat catatan trade: ' + error.message)
  }

  return (data || []).map((row) => {
    const acc = row.trading_accounts as { name?: string; currency?: string } | null
    const strat = row.strategies as { name?: string } | null
    return {
      ...row,
      entry_price: Number(row.entry_price),
      exit_price: row.exit_price !== null ? Number(row.exit_price) : null,
      position_size: Number(row.position_size ?? (row as unknown as { size?: number }).size ?? 0),
      gross_pnl: row.gross_pnl !== null ? Number(row.gross_pnl) : null,
      net_pnl: row.net_pnl !== null ? Number(row.net_pnl) : null,
      commission: Number(row.commission || 0),
      fee: Number(row.fee || 0),
      swap: Number(row.swap || 0),
      risk_amount: row.risk_amount !== null ? Number(row.risk_amount) : null,
      stop_loss: row.stop_loss !== null ? Number(row.stop_loss) : null,
      take_profit: row.take_profit !== null ? Number(row.take_profit) : null,
      account_name: acc?.name || 'Akun Trading',
      account_currency: acc?.currency || 'USD',
      strategy_name: strat?.name || undefined,
    }
  })
}

export async function fetchStrategies(): Promise<StrategyItem[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return []
  }
  return data || []
}

export async function createStrategy(name: string, description?: string): Promise<StrategyItem> {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Pengguna belum login.')

  const { data, error } = await supabase
    .from('strategies')
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Gagal membuat strategi: ' + error.message)
  }
  return data
}

export async function createTrade(input: CreateTradeInput) {
  if (!input.symbol.trim()) {
    throw new Error('Simbol pair/aset wajib diisi.')
  }
  if (input.entry_price <= 0) {
    throw new Error('Harga masuk (entry price) harus lebih besar dari 0.')
  }
  if (input.position_size <= 0) {
    throw new Error('Ukuran posisi / lot harus lebih besar dari 0.')
  }

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  const supabase = getSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Pengguna belum login atau sesi berakhir.')
  }

  const payload = {
    user_id: user.id,
    account_id: input.account_id,
    strategy_id: input.strategy_id || null,
    symbol: input.symbol.trim().toUpperCase(),
    market_type: input.market_type,
    direction: input.direction,
    status: 'open' as const,
    opened_at: input.opened_at,
    entry_price: input.entry_price,
    position_size: input.position_size,
    stop_loss: input.stop_loss || null,
    take_profit: input.take_profit || null,
    risk_amount: input.risk_amount || null,
    notes: input.notes?.trim() || null,
    commission: 0,
    fee: 0,
    swap: 0,
  }

  if (isOffline) {
    enqueueOfflineAction('trades', 'insert', payload)
    return { id: 'offline-' + Date.now(), ...payload }
  }

  const { data, error } = await supabase.from('trades').insert(payload).select().single()

  if (error) {
    throw new Error('Gagal mencatat trade baru: ' + error.message)
  }

  return data
}

export async function closeTrade(id: string, input: CloseTradeInput) {
  if (input.exit_price <= 0) {
    throw new Error('Harga keluar (exit price) harus lebih besar dari 0.')
  }

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  const supabase = getSupabase()

  const payload = {
    id,
    status: 'closed' as const,
    closed_at: input.closed_at,
    exit_price: input.exit_price,
    gross_pnl: input.gross_pnl,
    commission: input.commission ?? 0,
    fee: input.fee ?? 0,
    swap: input.swap ?? 0,
    notes: input.notes?.trim() || null,
  }

  if (isOffline) {
    enqueueOfflineAction('trades', 'update', payload)
    return payload
  }

  const { data, error } = await supabase
    .from('trades')
    .update({
      status: 'closed',
      closed_at: input.closed_at,
      exit_price: input.exit_price,
      gross_pnl: input.gross_pnl,
      commission: input.commission ?? 0,
      fee: input.fee ?? 0,
      swap: input.swap ?? 0,
      notes: input.notes?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error('Gagal menutup posisi trade: ' + error.message)
  }

  return data
}

export async function deleteTrade(id: string) {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  if (isOffline) {
    enqueueOfflineAction('trades', 'delete', { id })
    return
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('trades').delete().eq('id', id)

  if (error) {
    throw new Error('Gagal menghapus trade: ' + error.message)
  }
}
