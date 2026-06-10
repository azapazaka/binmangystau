// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { env, isSupabaseConfigured } from './env'

// If env vars are missing, create a placeholder client pointed at a dummy URL.
// The app will still render; actual API calls will fail with a clear error.
export const supabase = isSupabaseConfigured()
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false },
    })
