import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { updatePassword, verifyOtpForRecovery } from './api'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './useAuth'
import { validateEmail, validatePassword } from './validation'

type RecoveryStep = 'request_email' | 'enter_otp' | 'set_new_password' | 'completed'

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<RecoveryStep>('request_email')
  const [email, setEmail] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Send reset email / OTP
  async function handleSendEmail(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfoMsg(null)

    const emailErr = validateEmail(email)
    if (emailErr) {
      setError(emailErr)
      return
    }

    setIsSubmitting(true)
    const { error: resetErr } = await sendPasswordReset(email)
    setIsSubmitting(false)

    if (resetErr) {
      setError(resetErr.message || 'Gagal mengirim email reset password.')
      return
    }

    setInfoMsg(
      `Kode OTP dan tautan reset telah dikirim ke ${email}. Silakan periksa kotak masuk atau folder spam Anda.`,
    )
    setStep('enter_otp')
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!otpToken.trim()) {
      setError('Masukkan kode OTP yang Anda terima di email.')
      return
    }

    setIsSubmitting(true)
    const { error: otpErr } = await verifyOtpForRecovery(email, otpToken)
    setIsSubmitting(false)

    if (otpErr) {
      setError(otpErr.message || 'Kode OTP tidak valid atau sudah kedaluwarsa.')
      return
    }

    setStep('set_new_password')
  }

  // Step 3: Set new password
  async function handleSetPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const passErr = validatePassword(newPassword)
    if (passErr) {
      setError(passErr)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setIsSubmitting(true)
    const { error: updateErr } = await updatePassword(newPassword)
    setIsSubmitting(false)

    if (updateErr) {
      setError(updateErr.message || 'Gagal memperbarui password.')
      return
    }

    setStep('completed')
    setTimeout(() => {
      navigate('/', { replace: true })
    }, 2000)
  }

  // Resend OTP
  async function handleResend() {
    setError(null)
    setIsSubmitting(true)
    const { error: resendErr } = await sendPasswordReset(email)
    setIsSubmitting(false)

    if (resendErr) {
      setError(resendErr.message || 'Gagal mengirim ulang kode.')
    } else {
      setInfoMsg('Kode OTP baru telah berhasil dikirim ulang ke email Anda.')
    }
  }

  return (
    <AuthLayout
      title={
        step === 'request_email'
          ? 'Pemulihan Password'
          : step === 'enter_otp'
            ? 'Verifikasi Kode OTP'
            : step === 'set_new_password'
              ? 'Buat Password Baru'
              : 'Pemulihan Selesai'
      }
      subtitle={
        step === 'request_email'
          ? 'Masukkan alamat email Anda untuk menerima instruksi & kode OTP reset password.'
          : step === 'enter_otp'
            ? 'Masukkan 6 atau 8 digit kode OTP yang dikirimkan ke email Anda.'
            : step === 'set_new_password'
              ? 'Masukkan password baru yang aman untuk akun trading Anda.'
              : 'Password akun Anda berhasil diperbarui.'
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {infoMsg && step === 'enter_otp' && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* STEP 1: Request Email */}
      {step === 'request_email' && (
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-fg mb-1.5">
              Alamat Email Akun
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

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? 'Mengirim...' : 'Kirim Kode OTP / Tautan Reset'}
          </Button>

          <p className="text-center text-xs text-muted pt-2">
            Ingat password Anda?{' '}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Kembali ke Login
            </Link>
          </p>
        </form>
      )}

      {/* STEP 2: Input OTP */}
      {step === 'enter_otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label htmlFor="otp-input" className="block text-xs font-medium text-fg mb-1.5">
              Kode OTP dari Email
            </label>
            <input
              id="otp-input"
              type="text"
              required
              autoFocus
              maxLength={12}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.trim())}
              placeholder="Contoh: 123456 atau 12345678"
              className="block w-full rounded-lg border border-line bg-app py-3 px-3 text-center text-lg font-mono tracking-widest text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-2 text-[11px] text-muted text-center">
              Atau Anda juga dapat langsung mengklik tombol/tautan tautan di dalam email.
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Memverifikasi...' : 'Verifikasi Kode OTP'}
          </Button>

          <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setStep('request_email')}
              className="hover:text-fg"
            >
              Ganti Email
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting}
              className="font-medium text-primary hover:underline"
            >
              Kirim Ulang Kode
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Set New Password */}
      {step === 'set_new_password' && (
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label htmlFor="new-pass" className="block text-xs font-medium text-fg mb-1.5">
              Password Baru (Minimal 8 karakter)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                <LockIcon className="h-4 w-4" />
              </div>
              <input
                id="new-pass"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="block w-full rounded-lg border border-line bg-app py-2.5 pl-10 pr-10 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-fg"
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-pass" className="block text-xs font-medium text-fg mb-1.5">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                <LockIcon className="h-4 w-4" />
              </div>
              <input
                id="confirm-pass"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="block w-full rounded-lg border border-line bg-app py-2.5 pl-10 pr-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
          </Button>
        </form>
      )}

      {/* STEP 4: Completed */}
      {step === 'completed' && (
        <div className="text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-fg">Password Berhasil Diperbarui!</h3>
          <p className="mt-2 text-xs text-muted">
            Sesi akun Anda telah dipulihkan. Mengalihkan Anda langsung ke dashboard...
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button className="w-full">Buka Dashboard Sekarang</Button>
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
