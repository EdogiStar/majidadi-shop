import { createClient } from '@supabase/supabase-js'

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const supabaseUrl = getRequiredEnvironmentVariable('SUPABASE_URL')
const supabaseServiceRoleKey = getRequiredEnvironmentVariable(
  'SUPABASE_SERVICE_ROLE_KEY',
)

export const supabaseServer = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
)
