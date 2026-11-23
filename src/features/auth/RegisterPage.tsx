import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './useAuth'
import { validateEmail, validateFullName, validatePassword } from './validation'

export default function RegisterPage() {
  const { register, loginWithGoogle, resendVerificationEmail } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSuccessNeedsVerification, setIsSuccessNeedsVerification] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const nameErr = validateFullName(fullName)
    if (nameErr) {
      setError(nameErr)
      return
    }

    const emailErr = validateEmail(email)
    if (emailErr) {
      setError(emailErr)
      return
    }

    const passErr = validatePassword(password)
    if (passErr) {
      setError(passErr)
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setIsSubmitting(true)
    const { error: regError, needsEmailVerification } = await register({
      fullName,
      email,
      password,
    })
    setIsSubmitting(false)

    if (regError) {
      setError(regError.message || 'Gagal mendaftar akun.')
      return
    }

    if (needsEmailVerification) {
      setIsSuccessNeedsVerification(true)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setIsGoogleLoading(true)
    const { error: googleError } = await loginWithGoogle()
    if (googleError) {
      setIsGoogleLoading(false)
      setError(googleError.message || 'Gagal mendaftar dengan Google.')
    }
  }

  async function handleResend() {
    setResendStatus('Mengirim ulang...')
    const { error: resendErr } = await resendVerificationEmail(email)
    if (resendErr) {
      setResendStatus('Gagal mengirim email: ' + resendErr.message)
    } else {
      setResendStatus('Email verifikasi baru telah berhasil dikirim!')
    }
  }

  if (isSuccessNeedsVerification) {
    return (
      <AuthLayout title="Verifikasi Email Anda" subtitle="Satu langkah lagi sebelum Anda dapat mulai mencatat trade.">
        <div className="text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-fg">
            Tautan konfirmasi pendaftaran telah dikirim ke:
          </p>
          <p className="mt-1 font-semibold text-fg">{email}</p>
          <p className="mt-3 text-xs text-muted">
            Silakan buka email Anda dan klik tombol verifikasi untuk mengaktifkan akun.
          </p>

          {resendStatus && (
            <p className="mt-3 text-xs font-medium text-primary">{resendStatus}</p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button variant="secondary" onClick={handleResend} className="w-full">
              Kirim ulang email verifikasi
            </Button>
            <Link to="/auth/login" className="mt-2 text-xs text-primary hover:underline">
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Buat Akun Baru" subtitle="Mulai catat transaksi dan disiplin trading Anda hari ini.">
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
          <label htmlFor="fullName" className="block text-xs font-medium text-fg mb-1.5">
            Nama Lengkap
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <UserIcon className="h-4 w-4" />
            </div>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="block w-full rounded-lg border border-line bg-app py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-fg mb-1.5">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <MailIcon className="h-4 w-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              className="block w-full rounded-lg border border-line bg-app py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-fg mb-1.5">
            Password (Minimal 8 karakter)
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <LockIcon className="h-4 w-4" />
            </div>
            <input
              id="password"
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
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-fg mb-1.5">
            Konfirmasi Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <LockIcon className="h-4 w-4" />
            </div>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password di atas"
              className="block w-full rounded-lg border border-line bg-app py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="w-full mt-2"
        >
          {isSubmitting ? 'Mendaftarkan...' : 'Daftar Akun'}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-surface px-2 text-muted">atau</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isSubmitting || isGoogleLoading}
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-app px-4 text-sm font-medium text-fg hover:bg-sunken transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        <GoogleIcon />
        <span>{isGoogleLoading ? 'Menghubungkan...' : 'Daftar dengan Google'}</span>
      </button>

      <p className="mt-6 text-center text-xs text-muted">
        Sudah memiliki akun?{' '}
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Masuk di sini
        </Link>
      </p>
    </AuthLayout>
  )
}
