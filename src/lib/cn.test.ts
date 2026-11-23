import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('menggabungkan class dan membuang nilai kosong', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c')
  })

  it('mengembalikan string kosong bila tidak ada class', () => {
    expect(cn(false, null)).toBe('')
  })
})
