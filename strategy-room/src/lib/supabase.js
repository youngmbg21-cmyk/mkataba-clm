import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// These two values are public by design — they only work alongside a
// signed-in user and the security rules in schema.sql. The secret key
// and the Anthropic key live on the server and are never sent here.
export const configured = Boolean(url && key)

export const supabase = configured
  ? createClient(url, key)
  : null
