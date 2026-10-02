import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabaseClient() {
  if (client) return client

  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonymousKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonymousKey) {
    throw new Error('Supabase authentication is not configured.')
  }

  client = createClient(url, anonymousKey)
  return client
}
