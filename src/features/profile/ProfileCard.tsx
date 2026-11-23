import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircleIcon, CheckCircleIcon, LockIcon, LogOutIcon, UserIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { COMMON_TIMEZONES, validateDisplayName, validatePassword, validateTimezone } from '@/features/auth/validation'
import { useAuth } from '@/features/auth/useAuth'

export function ProfileCard() {
  const { user, profile, isEmailVerified, updateUserProfile, updateUserPassword, logout } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'Asia/Jakarta')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

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
      setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui!' })
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
      setShowPasswordSection(false)
    }
  }

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary font-bold text-base uppercase">
            {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-fg">
              {profile?.display_name || 'Trader'}
            </h3>
            <p className="text-xs text-muted">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEmailVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Email Terverifikasi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <AlertCircleIcon className="h-3.5 w-3.5" />
              Belum Verifikasi
            </span>
          )}

          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-app px-2.5 py-1.5 text-xs font-medium text-fg hover:bg-sunken transition-colors"
          >
            Detail Profil
          </Link>
          <Button
            variant="secondary"
            onClick={() => logout()}
            className="h-8 px-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-500/20"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>

      {profileMsg && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
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

      {/* Profil Form */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Informasi Profil
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="display-name" className="block text-xs font-medium text-fg mb-1.5">
              Nama Tampilan
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                <UserIcon className="h-4 w-4" />
              </div>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama Anda di jurnal"
                className="block w-full rounded-lg border border-line bg-app py-2 pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-xs font-medium text-fg mb-1.5">
              Zona Waktu
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="block w-full rounded-lg border border-line bg-app py-2 px-3 text-sm text-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            {isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}
          </Button>
        </div>
      </form>

      {/* Keamanan & Password */}
      <div className="border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Keamanan Akun
            </h4>
            <p className="text-xs text-muted mt-0.5">Ubah password akun trading Anda.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="h-8 px-3 text-xs"
          >
            <LockIcon className="h-3.5 w-3.5" />
            {showPasswordSection ? 'Tutup' : 'Ubah Password'}
          </Button>
        </div>

        {passwordMsg && (
          <div
            role="alert"
            className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-xs ${
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
          <form onSubmit={handleChangePassword} className="mt-4 space-y-3 rounded-lg border border-line bg-app p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-new-pass" className="block text-xs font-medium text-fg mb-1">
                  Password Baru
                </label>
                <input
                  id="profile-new-pass"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="block w-full rounded-lg border border-line bg-surface py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="profile-confirm-pass" className="block text-xs font-medium text-fg mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  id="profile-confirm-pass"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="block w-full rounded-lg border border-line bg-surface py-2 px-3 text-xs text-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={isSavingPassword} className="h-8 px-3 text-xs">
                {isSavingPassword ? 'Memperbarui...' : 'Perbarui Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  )
}
