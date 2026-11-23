import { describe, expect, it } from 'vitest'
import { isThemeMode, resolveTheme } from './theme'

describe('isThemeMode', () => {
  it('menerima hanya light, dark, dan system', () => {
    expect(isThemeMode('light')).toBe(true)
    expect(isThemeMode('dark')).toBe(true)
    expect(isThemeMode('system')).toBe(true)
    expect(isThemeMode('sepia')).toBe(false)
    expect(isThemeMode(null)).toBe(false)
    expect(isThemeMode(undefined)).toBe(false)
  })
})

describe('resolveTheme', () => {
  it('mode eksplisit mengabaikan preferensi sistem', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('mode system mengikuti preferensi sistem', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})
