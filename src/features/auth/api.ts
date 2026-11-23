import { getSupabase } from '@/lib/supabase'
import type { Database, Profile } from '@/types/database'
import type { LoginInput, ProfileUpdateInput, RegisterInput } from './types'

export async function signUpWithEmail(input: RegisterInput) {
  const supabase = getSupabase()
  const redirectUrl = `${window.location.origin}/auth/callback`

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
      },
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) return { data: null, error }

  // Supabase returns a user with empty identities array if email confirmation
  // is enabled and the user is already registered (obfuscated response)
  const isAlreadyRegistered =
    data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0

  if (isAlreadyRegistered) {
    return {
      data,
      error: new Error('Email ini sudah terdaftar. Silakan login atau gunakan reset password.'),
    }
  }

  return { data, error: null }
}

export async function signInWithEmail(input: LoginInput) {
  const supabase = getSupabase()
  return supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  })
}

export async function signInWithGoogle() {
  const supabase = getSupabase()
  const redirectUrl = `${window.location.origin}/auth/callback`

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
}

export async function signOut() {
  const supabase = getSupabase()
  return supabase.auth.signOut()
}

export async function sendPasswordReset(email: string) {
  const supabase = getSupabase()
  const redirectUrl = `${window.location.origin}/auth/reset-password`

  return supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectUrl,
  })
}

export async function verifyOtpForRecovery(email: string, token: string) {
  const supabase = getSupabase()
  return supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'recovery',
  })
}

export async function updatePassword(password: string) {
  const supabase = getSupabase()
  return supabase.auth.updateUser({ password })
}

export async function resendVerificationEmail(email: string) {
  const supabase = getSupabase()
  const redirectUrl = `${window.location.origin}/auth/callback`

  return supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: redirectUrl,
    },
  })
}

export async function fetchProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { data: null, error: new Error(error.message) }
  }
  return { data, error: null }
}

export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<{ data: Profile | null; error: Error | null }> {
  const supabase = getSupabase()
  const updates: Database['public']['Tables']['profiles']['Update'] = {}

  if (input.displayName !== undefined) updates.display_name = input.displayName.trim()
  if (input.timezone !== undefined) updates.timezone = input.timezone.trim()
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl.trim() || null

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) {
    return { data: null, error: new Error(error.message) }
  }
  return { data, error: null }
}
