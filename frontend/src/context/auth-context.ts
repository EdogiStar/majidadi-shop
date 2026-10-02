import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthResult = { error: string | null }

export type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  configurationError: string
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (fullName: string, email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
