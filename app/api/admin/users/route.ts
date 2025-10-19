import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

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
    const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 }) as any
    if (listErr) throw listErr

    const users = usersPage?.users ?? []
    const ids = users.map((u: any) => u.id)

    let rolesMap: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: roles } = await admin
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', ids)

      roles?.forEach((r: any) => { rolesMap[r.user_id] = r.role })
    }

    const out = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      role: rolesMap[u.id] ?? 'user'
    }))

    return NextResponse.json({ users: out })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { email, password, role } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true }) as any
    if (createErr) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })
    }

    const newUserId = created?.user?.id
    if (newUserId) {
      await admin.from('user_roles').upsert({ user_id: newUserId, role: role === 'admin' ? 'admin' : 'user' })
    }

    return NextResponse.json({ id: newUserId })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
