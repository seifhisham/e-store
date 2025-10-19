'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  email: string
  created_at: string
  role: 'admin' | 'user'
}

export default function AdminUsersClient() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user')
  const [creating, setCreating] = useState(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const createUser = async () => {
    try {
      if (!email || !password) {
        toast.error('Email and password are required')
        return
      }
      setCreating(true)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: newRole })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create user')
      }
      toast.success('User created')
      setEmail('')
      setPassword('')
      setNewRole('user')
      await loadUsers()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const toggleRole = async (id: string, role: 'admin' | 'user') => {
    try {
      const nextRole = role === 'admin' ? 'user' : 'admin'
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      })
      if (!res.ok) throw new Error('Failed to update role')
      toast.success('Role updated')
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: nextRole } : u))
    } catch (e) {
      toast.error('Failed to update role')
    }
  }

  return (
    <div className="space-y-8">
      {/* Create User */}
      <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Create New User</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-black placeholder:text-black"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-black placeholder:text-black"
          />
          <Select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          <Button onClick={createUser} disabled={creating}>
            {creating ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Users</h3>
          <Button onClick={loadUsers} disabled={loading}>
            Refresh
          </Button>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">
                      <span className={
                        u.role === 'admin'
                          ? 'px-2 py-1 rounded bg-primary text-primary-foreground'
                          : 'px-2 py-1 rounded bg-secondary text-secondary-foreground'
                      }>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{new Date(u.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <Button onClick={() => toggleRole(u.id, u.role)}>
                        Make {u.role === 'admin' ? 'User' : 'Admin'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
