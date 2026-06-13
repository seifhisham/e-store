"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Dialog, { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react'

type Category = {
  id: string
  value: string
  label: string
  product_count: number
}

const emptyForm = { value: '', label: '' }

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const json = await res.json()
      setCategories(json.categories || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setDialogOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({
      value: c.value,
      label: c.label,
    })
    setError('')
    setDialogOpen(true)
  }

  const saveCategory = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        value: form.value.trim(),
        label: form.label.trim(),
      }

      const res = editing
        ? await fetch(`/api/admin/categories/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to save category')
        return
      }

      await loadCategories()
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (c: Category) => {
    const ok = confirm(`Delete category "${c.label}"?`)
    if (!ok) return

    const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error || 'Failed to delete category')
      return
    }
    setCategories((prev) => prev.filter((x) => x.id !== c.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Categories</h1>
          <p className="text-black/70">Manage product categories shown across the store.</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto bg-black text-white hover:bg-primary hover:text-foreground">
          <Plus className="w-4 h-4 mr-2" /> New Category
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">All Categories</h2>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-foreground/70">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-sm text-foreground/70">No categories yet.</div>
        ) : (
          <div className="divide-y">
            {categories.map((c) => (
              <div key={c.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4">
                <div>
                  <p className="text-foreground font-semibold">{c.label}</p>
                  <p className="text-sm text-foreground/70">
                    Value: {c.value} • {c.product_count} product{c.product_count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteCategory(c)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
              <Input
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="e.g. Denim"
              />
              <p className="text-xs text-gray-500 mt-1">Stored on products; must be unique.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
              <Input
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Denim"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving} className="bg-black text-white hover:bg-primary hover:text-foreground">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
