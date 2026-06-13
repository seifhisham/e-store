import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { countProductsForCategory, getProductCountsByCategory } from '@/lib/category-product-counts'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await context.params
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.label != null) updates.label = String(body.label).trim()
    if (body.value != null) updates.value = String(body.value).trim()

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { data, error } = await admin
      .from('categories')
      .update(updates)
      .eq('id', id)
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await context.params
    const admin = await createAdminClient()

    const { data: category, error: fetchError } = await admin
      .from('categories')
      .select('value, label')
      .eq('id', id)
      .single()

    if (fetchError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const counts = await getProductCountsByCategory(admin)
    const productCount = countProductsForCategory(counts, category.value, category.label)

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product(s) use this category` },
        { status: 400 }
      )
    }

    const { error } = await admin.from('categories').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
