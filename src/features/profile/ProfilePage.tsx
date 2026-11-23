import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  LockIcon,
  LogOutIcon,
  UserIcon,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth/useAuth'
import {
  COMMON_TIMEZONES,
  validateDisplayName,
  validatePassword,
  validateTimezone,
} from '@/features/auth/validation'
import { getOfflineQueue } from '@/lib/offlineSyncQueue'
import { getSupabase } from '@/lib/supabase'
import type { ProfileStats } from './types'

export default function ProfilePage() {
  const { user, profile, isEmailVerified, updateUserProfile, updateUserPassword, logout } =
    useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'Asia/Jakarta')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password update state
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Stats
  const [stats, setStats] = useState<ProfileStats>({
    accountCount: 0,
    tradeCount: 0,
    cashCount: 0,
    offlineQueueCount: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true)
      try {
        const supabase = getSupabase()
        const [accRes, tradeRes, cashRes] = await Promise.all([
          supabase.from('trading_accounts').select('id', { count: 'exact', head: true }),
          supabase.from('trades').select('id', { count: 'exact', head: true }),
          supabase.from('cash_transactions').select('id', { count: 'exact', head: true }),
        ])

        const offlineItems = getOfflineQueue()

        setStats({
          accountCount: accRes.count || 0,
          tradeCount: tradeRes.count || 0,
          cashCount: cashRes.count || 0,
          offlineQueueCount: offlineItems.length,
        })
      } catch {
        // Fallback
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [])

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setProfileMsg(null)

    const nameErr = validateDisplayName(displayName)
    if (nameErr) {
      setProfileMsg({ type: 'error', text: nameErr })
      return
    }

    const tzErr = validateTimezone(timezone)
    if (tzErr) {
      setProfileMsg({ type: 'error', text: tzErr })
      return
    }

    setIsSavingProfile(true)
    const { error } = await updateUserProfile({
      displayName,
      timezone,
    })
    setIsSavingProfile(false)

    if (error) {
      setProfileMsg({ type: 'error', text: error.message || 'Gagal menyimpan profil.' })
    } else {
      setProfileMsg({ type: 'success', text: 'Profil pengguna berhasil diperbarui!' })
      setTimeout(() => setProfileMsg(null), 3000)
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)

    const passErr = validatePassword(newPassword)
    if (passErr) {
      setPasswordMsg({ type: 'error', text: passErr })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' })
      return
    }

    setIsSavingPassword(true)
    const { error } = await updateUserPassword(newPassword)
    setIsSavingPassword(false)

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message || 'Gagal mengganti password.' })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password berhasil diperbarui!' })
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMsg(null), 3000)
      setShowPasswordSection(false)
    }
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil & Akun Pengguna"
        description="Kelola identitas trader, statistik portofolio, zona waktu analisis, dan keamanan autentikasi."
      />

      {/* Main Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary font-bold text-2xl uppercase shadow-inner">
              {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || <UserIcon className="h-8 w-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-fg">
                  {profile?.display_name || 'Trader Aktif'}
                </h2>
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircleIcon className="h-3 w-3" />
                    Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    <AlertCircleIcon className="h-3 w-3" />
                    Belum Verifikasi
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5 font-mono">{user?.email}</p>
              <p className="text-[11px] text-muted mt-1">Anggota sejak: {memberSince}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => logout()}
            className="h-9 px-3 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-500/20 self-start sm:self-auto"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>Keluar dari Sesi</span>
          </Button>
        </div>

        {/* User Activity Stats */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Ringkasan Aktivitas Jurnal
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-app p-3">
              <p className="text-[11px] text-muted">Akun Trading</p>
              <p className="mt-1 text-lg font-bold text-fg">
                {loadingStats ? '...' : stats.accountCount}
              </p>
              <span className="text-[10px] text-muted">Akun terdaftar</span>
            </div>

            <div className="rounded-xl border border-line bg-app p-3">
              <p className="text-[11px] text-muted">Total Trade</p>
              <p className="mt-1 text-lg font-bold text-primary">
                {loadingStats ? '...' : stats.tradeCount}
              </p>
              <span className="text-[10px] text-muted">Posisi dicatat</span>
            </div>

            <div className="rounded-xl border border-line bg-app p-3">
              <p className="text-[11px] text-muted">Transaksi Kas</p>
              <p className="mt-1 text-lg font-bold text-fg">
                {loadingStats ? '...' : stats.cashCount}
              </p>
              <span className="text-[10px] text-muted">Deposit & withdraw</span>
            </div>

            <div className="rounded-xl border border-line bg-app p-3">
              <p className="text-[11px] text-muted">Antrean Offline</p>
              <p
                className={`mt-1 text-lg font-bold ${
                  stats.offlineQueueCount > 0 ? 'text-amber-500' : 'text-emerald-500'
                }`}
              >
                {loadingStats ? '...' : stats.offlineQueueCount}
              </p>
              <span className="text-[10px] text-muted">
                {stats.offlineQueueCount > 0 ? 'Menunggu koneksi' : 'Semua tersinkron'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile Form Card */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-fg mb-1">Informasi Profil Trader</h3>
        <p className="text-xs text-muted mb-4">
          Nama ini ditampilkan pada navigasi dan zona waktu digunakan untuk mengelompokkan grafik analisis kinerja harian dan bulanan.
        </p>

        {profileMsg && (
          <div
            role="alert"
            className={`mb-4 flex items-start gap-2 rounded-lg p-3 text-xs ${
              profileMsg.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-name" className="block text-xs font-medium text-fg mb-1.5">
                Nama Tampilan
              </label>
              <input
                id="p-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama Anda di jurnal"
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="p-tz" className="block text-xs font-medium text-fg mb-1.5">
                Zona Waktu Analisis (IR-05)
              </label>
              <select
                id="p-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg focus:border-primary focus:outline-none"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSavingProfile} className="h-9 px-4 text-xs">
              {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-fg">Keamanan & Password Akun</h3>
            <p className="text-xs text-muted mt-0.5">
              Gunakan password yang kuat untuk menjaga privasi jurnal transaksi keuangan Anda.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="h-8 px-3 text-xs"
          >
            <LockIcon className="h-3.5 w-3.5" />
            <span>{showPasswordSection ? 'Tutup' : 'Ganti Password'}</span>
          </Button>
        </div>

        {passwordMsg && (
          <div
            role="alert"
            className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-xs ${
              passwordMsg.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {passwordMsg.type === 'success' ? (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        {showPasswordSection && (
          <form
            onSubmit={handleChangePassword}
            className="mt-4 space-y-4 rounded-xl border border-line bg-app p-4 animate-in fade-in duration-150"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="p-newpass" className="block text-xs font-medium text-fg mb-1">
                  Password Baru *
                </label>
                <input
                  id="p-newpass"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="block w-full rounded-lg border border-line bg-surface py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="p-confirmpass" className="block text-xs font-medium text-fg mb-1">
                  Konfirmasi Password Baru *
                </label>
                <input
                  id="p-confirmpass"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="block w-full rounded-lg border border-line bg-surface py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={isSavingPassword} className="h-8 px-4 text-xs">
                {isSavingPassword ? 'Memperbarui...' : 'Simpan Password Baru'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
