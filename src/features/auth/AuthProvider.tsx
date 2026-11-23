import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import * as authApi from './api'
import { AuthContext } from './auth-context'
import type {
  AuthContextValue,
  LoginInput,
  ProfileUpdateInput,
  RegisterInput,
} from './types'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await authApi.fetchProfile(userId)
      if (data) {
        setProfile(data)
      }
    } catch {
      // Profile fetch failure shouldn't brick the app
    }
  }, [])

  const loginAsDemo = useCallback(() => {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      app_metadata: {},
      user_metadata: { full_name: 'Trader Demo' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'demo@tradingjournal.local',
      email_confirmed_at: new Date().toISOString(),
    } as unknown as User

    const demoProfile: Profile = {
      id: '00000000-0000-0000-0000-000000000001',
      display_name: 'Trader Demo',
      avatar_url: null,
      timezone: 'Asia/Jakarta',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const demoSession = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      user: demoUser,
    } as unknown as Session

    setSession(demoSession)
    setUser(demoUser)
    setProfile(demoProfile)
    setIsLoading(false)
    try {
      localStorage.setItem('tj_demo_mode', 'true')
    } catch {
      // Ignore storage errors
    }
  }, [])

  useEffect(() => {
    let mounted = true

    if (localStorage.getItem('tj_demo_mode') === 'true') {
      loginAsDemo()
      return
    }

    const supabase = getSupabase()

    // Ambil sesi awal
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          loadProfile(session.user.id)
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setIsLoading(false)
      })

    // Berlangganan perubahan status auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile, loginAsDemo])

  const login = useCallback(
    async (input: LoginInput) => {
      setIsLoading(true)
      const { data, error } = await authApi.signInWithEmail(input)
      if (error) {
        setIsLoading(false)
        return { error: new Error(error.message) }
      }
      if (data.session) {
        setSession(data.session)
        setUser(data.user)
        if (data.user) {
          await loadProfile(data.user.id)
        }
      }
      setIsLoading(false)
      return { error: null }
    },
    [loadProfile],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      setIsLoading(true)
      const { data, error } = await authApi.signUpWithEmail(input)
      setIsLoading(false)
      if (error) {
        return { error, needsEmailVerification: false }
      }
      if (data?.session) {
        setSession(data.session)
        setUser(data.user)
        if (data.user) {
          await loadProfile(data.user.id)
        }
        return { error: null, needsEmailVerification: false }
      }
      return { error: null, needsEmailVerification: true }
    },
    [loadProfile],
  )

  const loginWithGoogle = useCallback(async () => {
    const { error } = await authApi.signInWithGoogle()
    if (error) {
      return { error: new Error(error.message) }
    }
    return { error: null }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      localStorage.removeItem('tj_demo_mode')
      await authApi.signOut()
    } catch {
      // Ignore signOut errors on demo mode
    }
    setSession(null)
    setUser(null)
    setProfile(null)
    setIsLoading(false)
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await authApi.sendPasswordReset(email)
    if (error) {
      return { error: new Error(error.message) }
    }
    return { error: null }
  }, [])

  const updateUserPassword = useCallback(async (password: string) => {
    const { error } = await authApi.updatePassword(password)
    if (error) {
      return { error: new Error(error.message) }
    }
    return { error: null }
  }, [])

  const updateUserProfile = useCallback(
    async (input: ProfileUpdateInput) => {
      if (!user) return { error: new Error('Pengguna belum login.') }
      const { data, error } = await authApi.updateProfile(user.id, input)
      if (error) {
        return { error }
      }
      if (data) {
        setProfile(data)
      }
      return { error: null }
    },
    [user],
  )

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await authApi.resendVerificationEmail(email)
    if (error) {
      return { error: new Error(error.message) }
    }
    return { error: null }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }, [user, loadProfile])

  const isAuthenticated = Boolean(session && user)
  const isEmailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isAuthenticated,
      isEmailVerified,
      login,
      loginAsDemo,
      register,
      loginWithGoogle,
      logout,
      sendPasswordReset,
      updateUserPassword,
      updateUserProfile,
      resendVerificationEmail,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      isLoading,
      isAuthenticated,
      isEmailVerified,
      login,
      loginAsDemo,
      register,
      loginWithGoogle,
      logout,
      sendPasswordReset,
      updateUserPassword,
      updateUserProfile,
      resendVerificationEmail,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
