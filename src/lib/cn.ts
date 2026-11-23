type ClassValue = string | false | null | undefined

/** Menggabungkan nama class dan membuang nilai kosong. */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}
