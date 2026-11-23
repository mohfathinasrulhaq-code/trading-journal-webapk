import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  isEmailVerified: boolean
}

export interface RegisterInput {
  email: string
  password: string
  fullName: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface ProfileUpdateInput {
  displayName?: string
  timezone?: string
  avatarUrl?: string
}

export interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<{ error: Error | null }>
  loginAsDemo: () => void
  register: (input: RegisterInput) => Promise<{ error: Error | null; needsEmailVerification: boolean }>
  loginWithGoogle: () => Promise<{ error: Error | null }>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>
  updateUserPassword: (password: string) => Promise<{ error: Error | null }>
  updateUserProfile: (input: ProfileUpdateInput) => Promise<{ error: Error | null }>
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}
