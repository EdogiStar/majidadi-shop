import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../services/supabase'
import { validateProfileAvatar } from '../services/profilePresentation'
import { AuthContext, type AuthResult, type CustomerRole, type ProfileUpdate, type UserProfile } from './auth-context'

const PROFILE_FIELDS = 'full_name,phone,avatar_url,created_at,updated_at'
const PROFILE_AVATAR_BUCKET = 'profile-avatars'

function profileFromData(data: Record<string, unknown>): UserProfile {
  return {
    full_name: typeof data.full_name === 'string' ? data.full_name : null,
    phone: typeof data.phone === 'string' ? data.phone : null,
    avatar_url: typeof data.avatar_url === 'string' ? data.avatar_url : null,
    created_at: typeof data.created_at === 'string' ? data.created_at : '',
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : '',
  }
}

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
  const [role, setRole] = useState<CustomerRole | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [configurationError, setConfigurationError] = useState('')
  const [profileError, setProfileError] = useState('')
  const clientRef = useRef<ReturnType<typeof getSupabaseClient> | null>(null)
  const profileRequestId = useRef(0)

  const loadProfile = useCallback(async (client: ReturnType<typeof getSupabaseClient>, userId?: string) => {
    const requestId = ++profileRequestId.current
    setProfileError('')
    if (!userId) {
      setRole(null)
      setProfile(null)
      setLoading(false)
      return
    }

    setRole(null)
    setProfile(null)
    setLoading(true)
    try {
      const { data, error } = await client
        .from('profiles')
        .select(`role,${PROFILE_FIELDS}`)
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      if (requestId !== profileRequestId.current) return
      if (data?.role === 'admin' || data?.role === 'customer') {
        setRole(data.role)
        setProfile(profileFromData(data))
      } else {
        setProfileError('Unable to verify your account role. Please contact the shop.')
      }
    } catch {
      if (requestId === profileRequestId.current) {
        setProfileError('Unable to verify your account role. Please try again.')
      }
    } finally {
      if (requestId === profileRequestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}
    let authEventReceived = false
    void Promise.resolve().then(() => {
      if (!active) return null
      const client = getSupabaseClient()
      clientRef.current = client
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return
        authEventReceived = true
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
        void loadProfile(client, nextSession?.user.id)
      })
      unsubscribe = () => subscription.unsubscribe()
      return client.auth.getSession()
    }).then((result) => {
      if (!active || !result || authEventReceived) return
      if (result.error) throw result.error
      setSession(result.data.session)
      setUser(result.data.session?.user ?? null)
      return loadProfile(clientRef.current ?? getSupabaseClient(), result.data.session?.user.id)
    }).catch(() => {
      if (!active) return
      setConfigurationError(clientRef.current
        ? 'Unable to restore your account session. Refresh the page and try again.'
        : 'Account access is not configured. Please contact the shop.')
      setLoading(false)
    })
    return () => {
      active = false
      profileRequestId.current += 1
      unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    await loadProfile(clientRef.current ?? getSupabaseClient(), user.id)
  }, [loadProfile, user])

  const updateProfile = useCallback(async (values: ProfileUpdate): Promise<AuthResult> => {
    const fullName = values.fullName.trim()
    const phone = values.phone.trim()
    if (!fullName) return { error: 'Full name is required.' }
    if (fullName.length > 120) return { error: 'Full name must be 120 characters or fewer.' }
    if (phone.length > 40) return { error: 'Phone number must be 40 characters or fewer.' }
    const userId = user?.id
    if (!userId) return { error: 'Your account session is unavailable. Sign in again and retry.' }

    try {
      const { data, error } = await (clientRef.current ?? getSupabaseClient())
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null })
        .eq('id', userId)
        .select(PROFILE_FIELDS)
        .single()
      if (error) throw error
      if (user?.id === userId) {
        setProfile(profileFromData(data))
        setProfileError('')
      }
      return { error: null }
    } catch {
      return { error: 'Unable to save your profile right now. Please try again.' }
    }
  }, [user])

  const updateAvatar = useCallback(async (file: File): Promise<AuthResult> => {
    const validationError = validateProfileAvatar(file)
    if (validationError) return { error: validationError }
    const userId = user?.id
    if (!userId) return { error: 'Your account session is unavailable. Sign in again and retry.' }

    try {
      const client = clientRef.current ?? getSupabaseClient()
      const path = `profiles/${userId}/avatar`
      const { data: uploaded, error: uploadError } = await client.storage
        .from(PROFILE_AVATAR_BUCKET)
        .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: true })
      if (uploadError) throw uploadError

      const avatarUrl = client.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(uploaded.path).data.publicUrl
      const { data, error } = await client
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select(PROFILE_FIELDS)
        .single()
      if (error) throw error
      if (user?.id === userId) {
        setProfile(profileFromData(data))
        setProfileError('')
      }
      return { error: null }
    } catch {
      return { error: 'Unable to update your profile photo. Please try again.' }
    }
  }, [user])

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
      void loadProfile(clientRef.current ?? getSupabaseClient(), data.user.id)
      return { error: null }
    } catch {
      return { error: configurationError || 'Unable to register right now. Please try again.' }
    }
  }, [configurationError, loadProfile])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await (clientRef.current ?? getSupabaseClient()).auth.signOut()
      if (!error) {
        setSession(null)
        setUser(null)
        setRole(null)
        setProfile(null)
        setProfileError('')
        profileRequestId.current += 1
      }
      return { error: error ? userFacingAuthError(error.message, 'logout') : null }
    } catch {
      return { error: userFacingAuthError('', 'logout') }
    }
  }, [])

  const value = useMemo(() => ({
    user,
    session,
    role,
    profile,
    loading,
    configurationError,
    profileError,
    refreshProfile,
    updateProfile,
    updateAvatar,
    signIn,
    signUp,
    signOut,
  }), [user, session, role, profile, loading, configurationError, profileError, refreshProfile, updateProfile, updateAvatar, signIn, signUp, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
