import { getSupabase } from './supabase'

export interface OfflineQueueItem {
  id: string
  action: 'insert' | 'update' | 'delete'
  table: 'trades' | 'cash_transactions' | 'trading_accounts' | 'strategies' | 'profiles'
  payload: Record<string, unknown>
  createdAt: string
  retryCount: number
}

const STORAGE_KEY = 'tj_offline_sync_queue'

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as OfflineQueueItem[]
  } catch {
    return []
  }
}

export function saveOfflineQueue(queue: OfflineQueueItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Storage quota or error
  }
}

export function enqueueOfflineAction(
  table: OfflineQueueItem['table'],
  action: OfflineQueueItem['action'],
  payload: Record<string, unknown>,
): OfflineQueueItem {
  const queue = getOfflineQueue()
  const item: OfflineQueueItem = {
    id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
    table,
    action,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  }

  queue.push(item)
  saveOfflineQueue(queue)
  return item
}

export async function processOfflineQueue(): Promise<{
  successCount: number
  failedCount: number
  remaining: number
}> {
  const queue = getOfflineQueue()
  if (queue.length === 0) {
    return { successCount: 0, failedCount: 0, remaining: 0 }
  }

  const supabase = getSupabase()
  let successCount = 0
  let failedCount = 0
  const remainingItems: OfflineQueueItem[] = []

  for (const item of queue) {
    try {
      if (item.action === 'insert') {
        // Remove temporary offline id if generated
        const payloadToInsert = { ...item.payload }
        if (typeof payloadToInsert.id === 'string' && payloadToInsert.id.startsWith('offline-')) {
          delete payloadToInsert.id
        }

        const { error } = await supabase.from(item.table).insert(payloadToInsert as never)
        if (error) throw error
        successCount++
      } else if (item.action === 'update') {
        const id = item.payload.id as string
        const { error } = await supabase
          .from(item.table)
          .update(item.payload as never)
          .eq('id', id)
        if (error) throw error
        successCount++
      } else if (item.action === 'delete') {
        const id = item.payload.id as string
        const { error } = await supabase.from(item.table).delete().eq('id', id)
        if (error) throw error
        successCount++
      }
    } catch {
      failedCount++
      item.retryCount += 1
      // Keep in queue if retry under 5
      if (item.retryCount < 5) {
        remainingItems.push(item)
      }
    }
  }

  saveOfflineQueue(remainingItems)
  return {
    successCount,
    failedCount,
    remaining: remainingItems.length,
  }
}
