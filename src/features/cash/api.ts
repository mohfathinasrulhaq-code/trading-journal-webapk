import { enqueueOfflineAction } from '@/lib/offlineSyncQueue'
import { getSupabase } from '@/lib/supabase'
import type { CashTransactionWithAccount, CreateCashInput } from './types'

export async function fetchCashTransactions(
  accountId?: string,
): Promise<CashTransactionWithAccount[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('cash_transactions')
    .select('*, trading_accounts(name, currency)')
    .order('occurred_at', { ascending: false })

  if (accountId && accountId !== 'all') {
    query = query.eq('account_id', accountId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Gagal memuat transaksi kas: ' + error.message)
  }

  return (data || []).map((row) => {
    const acc = row.trading_accounts as { name?: string; currency?: string } | null
    return {
      id: row.id,
      user_id: row.user_id,
      account_id: row.account_id,
      type: row.type,
      amount: Number(row.amount),
      occurred_at: row.occurred_at,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      account_name: acc?.name || 'Akun Trading',
      account_currency: acc?.currency || 'USD',
    }
  })
}

export async function createCashTransaction(input: CreateCashInput) {
  if (input.amount <= 0) {
    throw new Error('Jumlah transaksi kas harus lebih besar dari 0.')
  }

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  const supabase = getSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Pengguna belum login atau sesi berakhir.')
  }

  // Pre-flight check IR-06: Guard against negative balance on withdraw
  if (input.type === 'withdraw' && !isOffline) {
    try {
      const { data: currentBal, error: balErr } = await supabase.rpc('get_account_balance', {
        p_account_id: input.account_id,
      })

      if (!balErr && currentBal !== null) {
        const bal = Number(currentBal)
        if (bal < input.amount) {
          throw new Error(
            `Penarikan ditolak (IR-06): Saldo tidak mencukupi. Saldo berjalan saat ini adalah ${bal.toLocaleString(
              'id-ID',
            )}, sedangkan jumlah penarikan yang diminta adalah ${input.amount.toLocaleString('id-ID')}.`,
          )
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Penarikan ditolak')) {
        throw err
      }
      // If RPC fails for permissions or offline, proceed to DB trigger check
    }
  }

  const payload = {
    user_id: user.id,
    account_id: input.account_id,
    type: input.type,
    amount: input.amount,
    occurred_at: input.occurred_at,
    note: input.note ? input.note.trim() : null,
  }

  if (isOffline) {
    enqueueOfflineAction('cash_transactions', 'insert', payload)
    return { id: 'offline-' + Date.now(), ...payload }
  }

  const { data, error } = await supabase
    .from('cash_transactions')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.message.includes('negative balance') || error.code === '23514') {
      throw new Error('Penarikan ditolak (IR-06): Penarikan akan menyebabkan saldo akun menjadi negatif.')
    }
    throw new Error('Gagal mencatat transaksi kas: ' + error.message)
  }

  return data
}

export async function deleteCashTransaction(id: string) {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  if (isOffline) {
    enqueueOfflineAction('cash_transactions', 'delete', { id })
    return
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('cash_transactions').delete().eq('id', id)

  if (error) {
    throw new Error('Gagal menghapus transaksi kas: ' + error.message)
  }
}
