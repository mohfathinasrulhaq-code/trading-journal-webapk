import { describe, expect, it } from 'vitest'
import {
  validateDisplayName,
  validateEmail,
  validateFullName,
  validatePassword,
  validateTimezone,
} from './validation'

describe('Auth Validation', () => {
  describe('validateEmail', () => {
    it('menolak email kosong', () => {
      expect(validateEmail('')).toBe('Email wajib diisi.')
      expect(validateEmail('   ')).toBe('Email wajib diisi.')
    })

    it('menolak format email tidak valid', () => {
      expect(validateEmail('user')).toBe('Format email tidak valid.')
      expect(validateEmail('user@')).toBe('Format email tidak valid.')
      expect(validateEmail('@domain.com')).toBe('Format email tidak valid.')
      expect(validateEmail('user@domain')).toBe('Format email tidak valid.')
    })

    it('menerima format email yang benar', () => {
      expect(validateEmail('trader@example.com')).toBeNull()
      expect(validateEmail('trader.pro@sub.domain.co.id')).toBeNull()
    })
  })

  describe('validatePassword', () => {
    it('menolak password kurang dari 8 karakter', () => {
      expect(validatePassword('')).toBe('Password wajib diisi.')
      expect(validatePassword('1234567')).toBe('Password minimal 8 karakter.')
    })

    it('menerima password 8 karakter atau lebih', () => {
      expect(validatePassword('12345678')).toBeNull()
      expect(validatePassword('PasswordKu123!')).toBeNull()
    })

    it('menolak password lebih dari 72 karakter', () => {
      expect(validatePassword('a'.repeat(73))).toBe('Password maksimal 72 karakter.')
    })
  })

  describe('validateFullName & DisplayName', () => {
    it('memvalidasi nama lengkap', () => {
      expect(validateFullName('')).toBe('Nama lengkap wajib diisi.')
      expect(validateFullName('A')).toBe('Nama lengkap minimal 2 karakter.')
      expect(validateFullName('Budi Santoso')).toBeNull()
    })

    it('memvalidasi nama tampilan', () => {
      expect(validateDisplayName('')).toBe('Nama tampilan wajib diisi.')
      expect(validateDisplayName('a'.repeat(81))).toBe('Nama tampilan maksimal 80 karakter.')
      expect(validateDisplayName('Trader FX')).toBeNull()
    })
  })

  describe('validateTimezone', () => {
    it('menerima zona waktu IANA valid', () => {
      expect(validateTimezone('Asia/Jakarta')).toBeNull()
      expect(validateTimezone('UTC')).toBeNull()
      expect(validateTimezone('America/New_York')).toBeNull()
    })

    it('menolak zona waktu tidak valid', () => {
      expect(validateTimezone('')).toBe('Zona waktu wajib dipilih.')
      expect(validateTimezone('Invalid/Timezone')).toBe('Zona waktu tidak valid.')
    })
  })
})
