import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Return null during build time/static generation
  if (typeof window === 'undefined' || !url || !key) {
    console.warn('Supabase environment variables not found:', { url: !!url, key: !!key })
    return null
  }
  
  return createBrowserClient<Database>(url, key)
}
