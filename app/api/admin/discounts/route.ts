import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
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
    const { data, error } = await admin
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    // Auto-deactivate discounts that have passed their end date
    const now = new Date()
    const toDeactivate = (data || []).filter((d: any) => d.active === true && d.ends_at && new Date(d.ends_at) < now)
    if (toDeactivate.length > 0) {
      const ids = toDeactivate.map((d: any) => d.id)
      await admin.from('discounts').update({ active: false }).in('id', ids as any)
      // Reflect the deactivation in the response payload
      for (const d of data || []) {
        if (ids.includes(d.id)) d.active = false
      }
    }

    return NextResponse.json({ discounts: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, percentage, active = false, starts_at = null, ends_at = null } = body || {}
    if (!name || percentage == null) {
      return NextResponse.json({ error: 'Missing name or percentage' }, { status: 400 })
    }

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
    const { data, error } = await admin
      .from('discounts')
      .insert({ name, percentage, active, starts_at, ends_at })
      .select('*')
      .single()
    if (error) throw error

    return NextResponse.json({ discount: data })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
