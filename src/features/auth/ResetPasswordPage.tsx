import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircleIcon, CheckCircleIcon, EyeIcon, EyeOffIcon, LockIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './useAuth'
import { validatePassword } from './validation'

export default function ResetPasswordPage() {
  const { updateUserPassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const passErr = validatePassword(password)
    if (passErr) {
      setError(passErr)
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.')
      return
    }

    setIsSubmitting(true)
    const { error: updateErr } = await updateUserPassword(password)
    setIsSubmitting(false)

    if (updateErr) {
      setError(updateErr.message || 'Gagal mengatur ulang password.')
      return
    }

    setIsSuccess(true)
    setTimeout(() => {
      navigate('/', { replace: true })
    }, 2000)
  }

  return (
    <AuthLayout
      title="Atur Password Baru"
      subtitle="Buat password baru yang aman untuk akun Anda."
    >
      {isSuccess ? (
        <div className="text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-fg">Password Berhasil Diubah!</h3>
          <p className="mt-2 text-xs text-muted">
            Password akun Anda telah berhasil diperbarui. Mengalihkan Anda ke dashboard...
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button className="w-full">Buka Dashboard</Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400"
            >
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-medium text-fg mb-1.5">
                Password Baru (Minimal 8 karakter)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                  <LockIcon className="h-4 w-4" />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="block w-full rounded-lg border border-line bg-app py-2.5 pl-10 pr-10 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-fg"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-xs font-medium text-fg mb-1.5">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                  <LockIcon className="h-4 w-4" />
                </div>
                <input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="block w-full rounded-lg border border-line bg-app py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
