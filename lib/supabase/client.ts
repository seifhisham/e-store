'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  try {
    // Force load environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('Environment check:', {
      url: url ? '✅ Found' : '❌ Missing',
      anonKey: anonKey ? '✅ Found' : '❌ Missing'
    })

    if (!url) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL is required'
      )
    }
    if (!anonKey) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }

    return createBrowserClient(url, anonKey)
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error
  }
}
