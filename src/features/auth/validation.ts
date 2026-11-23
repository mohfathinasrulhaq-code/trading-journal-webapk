export const COMMON_TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB - Jakarta (UTC+07:00)' },
  { value: 'Asia/Makassar', label: 'WITA - Makassar / Bali (UTC+08:00)' },
  { value: 'Asia/Jayapura', label: 'WIT - Jayapura (UTC+09:00)' },
  { value: 'UTC', label: 'UTC (UTC+00:00)' },
  { value: 'America/New_York', label: 'EST / EDT - New York (UTC-05:00 / UTC-04:00)' },
  { value: 'Europe/London', label: 'GMT / BST - London (UTC+00:00 / UTC+01:00)' },
  { value: 'Asia/Singapore', label: 'SGT - Singapore (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'JST - Tokyo (UTC+09:00)' },
  { value: 'Australia/Sydney', label: 'AEST / AEDT - Sydney (UTC+10:00 / UTC+11:00)' },
] as const

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Email wajib diisi.'
  if (!EMAIL_REGEX.test(trimmed)) return 'Format email tidak valid.'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password wajib diisi.'
  if (password.length < 8) return 'Password minimal 8 karakter.'
  if (password.length > 72) return 'Password maksimal 72 karakter.'
  return null
}

export function validateFullName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Nama lengkap wajib diisi.'
  if (trimmed.length < 2) return 'Nama lengkap minimal 2 karakter.'
  if (trimmed.length > 80) return 'Nama lengkap maksimal 80 karakter.'
  return null
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Nama tampilan wajib diisi.'
  if (trimmed.length > 80) return 'Nama tampilan maksimal 80 karakter.'
  return null
}

export function validateTimezone(tz: string): string | null {
  const trimmed = tz.trim()
  if (!trimmed) return 'Zona waktu wajib dipilih.'
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed })
    return null
  } catch {
    return 'Zona waktu tidak valid.'
  }
}
