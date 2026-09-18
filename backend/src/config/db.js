import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey, {
  auth: { persistSession: false }
})

export async function connectDB() {
  const { error } = await supabase.from('users').select('id').limit(1)
  if (error) {
    throw new Error(`[supabase] connection check failed: ${error.message}`)
  }
  console.log('[supabase] connected ->', env.supabaseUrl)
}

export async function disconnectDB() {
  // Supabase's client is a plain HTTP client -- there is no persistent
  // connection to tear down, but this is kept so callers (seeders/index.js,
  // server.js) don't need to know that.
}
