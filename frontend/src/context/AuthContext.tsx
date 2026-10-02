import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../services/supabase'
import { AuthContext, type AuthResult } from './auth-context'

function userFacingAuthError(message: string, action: 'login' | 'register' | 'logout') {
  const normalized = message.toLowerCase()
  if (action === 'login' && (normalized.includes('invalid login') || normalized.includes('invalid credentials'))) {
    return 'The email or password is incorrect.'
  }
  if (action === 'register' && normalized.includes('already registered')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (action === 'register' && normalized.includes('password')) {
    return 'Choose a stronger password and try again.'
  }
  return action === 'logout'
    ? 'Unable to log out right now. Please try again.'
    : 'Unable to complete that request right now. Please try again.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [configurationError, setConfigurationError] = useState('')
  const clientRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null)

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}
    void Promise.resolve().then(() => {
      if (!active) return null
      const client = getSupabaseClient()
      clientRef.current = client
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
        setLoading(false)
      })
      unsubscribe = () => subscription.unsubscribe()
      return client.auth.getSession()
    }).then((result) => {
      if (!active || !result) return
      if (result.error) throw result.error
      setSession(result.data.session)
      setUser(result.data.session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setConfigurationError(clientRef.current
        ? 'Unable to restore your account session. Refresh the page and try again.'
        : 'Account access is not configured. Please contact the shop.')
      setLoading(false)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await (clientRef.current ?? getSupabaseClient()).auth.signInWithPassword({ email, password })
      return { error: error ? userFacingAuthError(error.message, 'login') : null }
    } catch {
      return { error: configurationError || 'Unable to sign in right now. Please try again.' }
    }
  }, [configurationError])

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await (clientRef.current ?? getSupabaseClient()).auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) return { error: userFacingAuthError(error.message, 'register') }
      if (!data.session || !data.user) {
        return { error: 'Registration did not start an authenticated session. Disable email confirmation in Supabase Auth settings and try again.' }
      }
      setSession(data.session)
      setUser(data.user)
      return { error: null }
    } catch {
      return { error: configurationError || 'Unable to register right now. Please try again.' }
    }
  }, [configurationError])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await (clientRef.current ?? getSupabaseClient()).auth.signOut()
      if (!error) {
        setSession(null)
        setUser(null)
      }
      return { error: error ? userFacingAuthError(error.message, 'logout') : null }
    } catch {
      return { error: userFacingAuthError('', 'logout') }
    }
  }, [])

  const value = useMemo(() => ({
    user,
    session,
    loading,
    configurationError,
    signIn,
    signUp,
    signOut,
  }), [user, session, loading, configurationError, signIn, signUp, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
