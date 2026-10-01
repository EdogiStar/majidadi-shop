import type { NextFunction, Request, Response } from 'express'
import type { User } from '@supabase/supabase-js'
import { supabaseServer } from '../config/supabase.js'

export type AuthenticatedUser = User

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = request.get('authorization')
  const match = authorization?.match(/^Bearer\s+(\S+)$/i)

  if (!match) {
    response.status(401).json({ error: 'Authentication required' })
    return
  }

  const accessToken = match[1]

  if (!accessToken) {
    response.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const { data, error } = await supabaseServer.auth.getUser(accessToken)

    if (error || !data.user) {
      response.status(401).json({ error: 'Invalid authentication token' })
      return
    }

    request.user = data.user
    next()
  } catch (error) {
    console.error('Authentication lookup failed', error)
    response.status(401).json({ error: 'Invalid authentication token' })
  }
}
