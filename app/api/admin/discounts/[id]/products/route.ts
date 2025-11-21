import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 401 as const }
  const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  if (!roleRow || roleRow.role !== 'admin') return { status: 403 as const }
  const admin = await createAdminClient()
  return { status: 200 as const, admin }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const r = await ensureAdmin()
    if (r.status !== 200) return NextResponse.json({ error: r.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: r.status })

    const { data, error } = await r.admin
      .from('discount_products')
      .select('product_id, products:product_id ( id, name )')
      .eq('discount_id', id)
    if (error) throw error

    const products = (data || []).map((row: any) => ({ id: row.products?.id || row.product_id, name: row.products?.name || '' }))
    return NextResponse.json({ products })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { add = [], remove = [], assign_all = false, remove_all = false }: { add?: string[]; remove?: string[]; assign_all?: boolean; remove_all?: boolean } = await request.json()

    const r = await ensureAdmin()
    if (r.status !== 200) return NextResponse.json({ error: r.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: r.status })

    if (remove_all) {
      const { error } = await r.admin
        .from('discount_products')
        .delete()
        .eq('discount_id', id)
      if (error) throw error
    }

    if (assign_all) {
      // Bulk-assign discount to all products without sending IDs from the client
      // Fetch all product IDs server-side in chunks
      const pageSize = 1000
      let from = 0
      let more = true
      while (more) {
        const { data, count, error } = await r.admin
          .from('products')
          .select('id', { count: 'exact' as any })
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1)
        if (error) throw error
        const ids = (data || []).map((row: any) => row.id)
        if (ids.length > 0) {
          const payload = ids.map((pid: string) => ({ discount_id: id, product_id: pid }))
          const { error: upsertErr } = await r.admin
            .from('discount_products')
            .upsert(payload, { onConflict: 'discount_id,product_id' as any })
          if (upsertErr) throw upsertErr
        }
        from += pageSize
        more = !!count && from < count
      }
    }

    if (!assign_all && Array.isArray(add) && add.length > 0) {
      const payload = add.map((pid) => ({ discount_id: id, product_id: pid }))
      const { error } = await r.admin.from('discount_products').upsert(payload, { onConflict: 'discount_id,product_id' as any })
      if (error) throw error
    }

    if (Array.isArray(remove) && remove.length > 0) {
      const { error } = await r.admin.from('discount_products').delete().eq('discount_id', id).in('product_id', remove)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
