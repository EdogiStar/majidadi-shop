import type { RequestHandler } from 'express'
import type { User } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'

export type AuthenticatedUser = User
export type AccessTokenVerifier = (accessToken: string) => Promise<User | null>
export type AdminChecker = (userId: string) => Promise<boolean>

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

const verifySupabaseAccessToken: AccessTokenVerifier = async (accessToken) => {
  const { data, error } = await supabaseServer.auth.getUser(accessToken)
  return error ? null : data.user
}

export function createRequireAuth(
  verifyAccessToken: AccessTokenVerifier = verifySupabaseAccessToken,
): RequestHandler {
  return async (request, response, next) => {
    const match = request.get('authorization')?.match(/^Bearer\s+(\S+)$/i)
    if (!match?.[1]) {
      response.status(401).json({ error: 'Authentication required' })
      return
    }

    try {
      const user = await verifyAccessToken(match[1])
      if (!user) {
        response.status(401).json({ error: 'Invalid authentication token' })
        return
      }
      request.user = user
      next()
    } catch (error) {
      console.error('Authentication lookup failed', error)
      response.status(401).json({ error: 'Invalid authentication token' })
    }
  }
}

export function createRequireAdmin(isAdmin: AdminChecker): RequestHandler {
  return async (request, response, next) => {
    if (!request.user) {
      response.status(401).json({ error: 'Authentication required' })
      return
    }

    try {
      if (!(await isAdmin(request.user.id))) {
        response.status(403).json({ error: 'Administrator access required' })
        return
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const requireAuth = createRequireAuth()
