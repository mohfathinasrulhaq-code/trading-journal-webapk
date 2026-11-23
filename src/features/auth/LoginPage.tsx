import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircleIcon, EyeIcon, EyeOffIcon, GoogleIcon, LockIcon, MailIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './useAuth'
import { validateEmail, validatePassword } from './validation'

export default function LoginPage() {
  const { login, loginAsDemo, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

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

    setIsSubmitting(true)
    const { error: loginError } = await login({ email, password })
    setIsSubmitting(false)

    if (loginError) {
      setError(loginError.message || 'Gagal login. Periksa kembali email dan password Anda.')
      return
    }

    navigate('/', { replace: true })
  }

  async function handleGoogleLogin() {
    setError(null)
    setIsGoogleLoading(true)
    const { error: googleError } = await loginWithGoogle()
    if (googleError) {
      setIsGoogleLoading(false)
      setError(googleError.message || 'Gagal menginisialisasi login dengan Google.')
    }
  }

  return (
    <AuthLayout title="Masuk ke Akun Anda" subtitle="Kelola jurnal trading dan evaluasi performa Anda.">
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
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-fg">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <LockIcon className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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

        <Button
          type="submit"
          disabled={isSubmitting || isGoogleLoading}
          className="w-full mt-2"
        >
          {isSubmitting ? 'Memproses...' : 'Masuk'}
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

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting || isGoogleLoading}
          className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-line bg-app px-4 text-sm font-medium text-fg hover:bg-sunken transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          <GoogleIcon />
          <span>{isGoogleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            loginAsDemo()
            navigate('/', { replace: true })
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <span>⚡ Masuk Cepat (Mode Demo / Langsung Buka Dashboard)</span>
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Belum punya akun?{' '}
        <Link to="/auth/register" className="font-semibold text-primary hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </AuthLayout>
  )
}
