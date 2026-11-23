import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { AccountWithBalance, CreateAccountInput, UpdateAccountInput } from './types'

export async function fetchAccountsWithBalance(): Promise<AccountWithBalance[]> {
  const supabase = getSupabase()

  const { data: accounts, error } = await supabase
    .from('trading_accounts')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error('Gagal memuat akun trading: ' + error.message)
  }

  if (!accounts || accounts.length === 0) {
    return []
  }

  // Fetch balance for each account using get_account_balance RPC
  const results: AccountWithBalance[] = []
  for (const acc of accounts) {
    try {
      const { data: bal } = await supabase.rpc('get_account_balance', {
        p_account_id: acc.id,
      })
      results.push({
        ...acc,
        balance: bal !== null ? Number(bal) : 0,
      })
    } catch {
      results.push({
        ...acc,
        balance: 0,
      })
    }
  }

  return results
}

export async function createAccount(input: CreateAccountInput) {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Pengguna belum terautentikasi.')

  const { data, error } = await supabase
    .from('trading_accounts')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      broker: input.broker?.trim() || null,
      account_type: input.account_type,
      currency: input.currency.trim().toUpperCase(),
    })
    .select()
    .single()

  if (error) {
    throw new Error('Gagal membuat akun: ' + error.message)
  }
  return data
}

export async function updateAccount(id: string, input: UpdateAccountInput) {
  const supabase = getSupabase()
  const updates: Database['public']['Tables']['trading_accounts']['Update'] = {}

  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.broker !== undefined) updates.broker = input.broker.trim() || null
  if (input.is_archived !== undefined) updates.is_archived = input.is_archived

  const { data, error } = await supabase
    .from('trading_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error('Gagal memperbarui akun: ' + error.message)
  }
  return data
}

export async function deleteAccount(id: string) {
  const supabase = getSupabase()
  const { error } = await supabase.from('trading_accounts').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      throw new Error(
        'Akun tidak dapat dihapus karena masih memiliki riwayat transaksi trade atau kas. Gunakan fitur Arsipkan Akun.',
      )
    }
    throw new Error('Gagal menghapus akun: ' + error.message)
  }
}
