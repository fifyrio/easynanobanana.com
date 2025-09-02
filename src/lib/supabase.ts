import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
)

export async function signInWithGoogle() {
  const redirectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback`
    : `${config.app.url}/auth/callback`
    
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  })
  
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}