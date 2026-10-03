import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthResult = { error: string | null }
export type CustomerRole = 'customer' | 'admin'
export type UserProfile = {
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
export type ProfileUpdate = { fullName: string; phone: string }

export type AuthContextValue = {
  user: User | null
  session: Session | null
  role: CustomerRole | null
  profile: UserProfile | null
  loading: boolean
  configurationError: string
  profileError: string
  refreshProfile: () => Promise<void>
  updateProfile: (values: ProfileUpdate) => Promise<AuthResult>
  updateAvatar: (file: File) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (fullName: string, email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
