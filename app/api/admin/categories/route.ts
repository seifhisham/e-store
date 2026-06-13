import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { attachProductCounts, countProductsForCategory, getProductCountsByCategory } from '@/lib/category-product-counts'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const admin = await createAdminClient()
    const { data, error } = await admin
      .from('categories')
      .select('id, value, label')
      .order('label', { ascending: true })

    if (error) throw error

    const categories = await attachProductCounts(admin, data || [])

    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { value, label } = body || {}
    if (!value?.trim() || !label?.trim()) {
      return NextResponse.json({ error: 'Value and label are required' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { data, error } = await admin
      .from('categories')
      .insert({
        value: value.trim(),
        label: label.trim(),
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A category with this value already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ category: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
