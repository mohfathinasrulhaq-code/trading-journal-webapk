import { beforeEach, describe, expect, it } from 'vitest'
import {
  enqueueOfflineAction,
  getOfflineQueue,
  saveOfflineQueue,
} from './offlineSyncQueue'

const store: Record<string, string> = {}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    length: 0,
    key: () => null,
  } as unknown as Storage
}

describe('OfflineSyncQueue Module', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mengembalikan array kosong jika belum ada antrean', () => {
    expect(getOfflineQueue()).toEqual([])
  })

  it('berhasil menambahkan aksi baru ke antrean offline', () => {
    const item = enqueueOfflineAction('trades', 'insert', {
      symbol: 'EURUSD',
      entry_price: 1.085,
      size: 1.0,
    })

    expect(item.id).toContain('offline-')
    expect(item.table).toBe('trades')
    expect(item.action).toBe('insert')
    expect(item.payload.symbol).toBe('EURUSD')

    const queue = getOfflineQueue()
    expect(queue.length).toBe(1)
    expect(queue[0].id).toBe(item.id)
  })

  it('dapat menyimpan dan memuat beberapa antrean transaksi sekaligus', () => {
    enqueueOfflineAction('trades', 'insert', { symbol: 'GBPUSD' })
    enqueueOfflineAction('cash_transactions', 'insert', { amount: 500, type: 'deposit' })

    const queue = getOfflineQueue()
    expect(queue.length).toBe(2)
    expect(queue[0].table).toBe('trades')
    expect(queue[1].table).toBe('cash_transactions')
  })

  it('dapat memperbarui antrean secara langsung', () => {
    enqueueOfflineAction('trades', 'insert', { symbol: 'XAUUSD' })
    const queue = getOfflineQueue()
    saveOfflineQueue(queue.filter((i) => i.payload.symbol !== 'XAUUSD'))
    expect(getOfflineQueue()).toEqual([])
  })
})
