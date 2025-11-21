import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || '25')))
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleRow || roleRow.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = await createAdminClient()
    let query = admin.from('products').select('id, name', { count: 'exact' as any }).order('name', { ascending: true })

    if (q) {
      query = query.ilike('name', `%${q}%`)
    }

    const { data, count, error } = await query.range(from, to)
    if (error) throw error

    return NextResponse.json({ products: data || [], total: count || 0, page, limit })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
