"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Dialog, { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Plus, Trash2, Search, Loader2, Check, X } from 'lucide-react'

type Discount = {
  id: string
  name: string
  percentage: number
  active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

type Product = { id: string; name: string }

export default function AdminDiscountsPage() {
  const [loading, setLoading] = useState(true)
  const [discounts, setDiscounts] = useState<Discount[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', percentage: '', active: false, starts_at: '', ends_at: '' })

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignFor, setAssignFor] = useState<Discount | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)
  const [assigned, setAssigned] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const [resultsPage, setResultsPage] = useState(1)
  const [resultsLimit, setResultsLimit] = useState(10)
  const [resultsTotal, setResultsTotal] = useState(0)
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const [confirmUnassignAllOpen, setConfirmUnassignAllOpen] = useState(false)
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false)
  const assignedIds = useMemo(() => new Set(assigned.map(p => p.id)), [assigned])

  const loadDiscounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/discounts')
      const json = await res.json()
      setDiscounts(json.discounts || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiscounts()
  }, [])

  const resetForm = () => setForm({ name: '', percentage: '', active: false, starts_at: '', ends_at: '' })

  const dateToInput = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  // Compute next Black Friday (Friday after 4th Thursday of November) and Cyber Monday (next Monday)
  const blackFridayPreset = () => {
    const now = new Date()
    let year = now.getFullYear()
    // Find Thanksgiving (4th Thursday of November)
    const thanksgiving = (() => {
      const nov1 = new Date(year, 10, 1) // November is month 10 (0-indexed)
      const day = nov1.getDay() // 0=Sun ... 4=Thu
      // First Thursday date in November
      const firstThu = 1 + ((4 - day + 7) % 7)
      // 4th Thursday
      return new Date(year, 10, firstThu + 21)
    })()
    let blackFriday = new Date(thanksgiving)
    blackFriday.setDate(thanksgiving.getDate() + 1)
    let cyberMonday = new Date(blackFriday)
    cyberMonday.setDate(blackFriday.getDate() + 3)
    // If the window already passed for this year, compute for next year
    if (cyberMonday < now) {
      year = year + 1
      const nov1 = new Date(year, 10, 1)
      const day = nov1.getDay()
      const firstThu = 1 + ((4 - day + 7) % 7)
      const nextThanksgiving = new Date(year, 10, firstThu + 21)
      blackFriday = new Date(nextThanksgiving)
      blackFriday.setDate(nextThanksgiving.getDate() + 1)
      cyberMonday = new Date(blackFriday)
      cyberMonday.setDate(blackFriday.getDate() + 3)
    }

    setForm({
      name: 'Black Friday',
      percentage: '30',
      active: true,
      starts_at: dateToInput(blackFriday),
      ends_at: dateToInput(cyberMonday),
    })
    setCreateOpen(true)
  }

  const createDiscount = async () => {
    setCreating(true)
    try {
      const body = {
        name: form.name.trim(),
        percentage: Number(form.percentage) || 0,
        active: !!form.active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      }
      const res = await fetch('/api/admin/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('failed')
      await loadDiscounts()
      setCreateOpen(false)
      resetForm()
    } catch {
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (d: Discount) => {
    const prev = discounts
    setDiscounts(discounts.map(x => (x.id === d.id ? { ...x, active: !x.active } : x)))
    const res = await fetch(`/api/admin/discounts/${d.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !d.active }) })
    if (!res.ok) setDiscounts(prev)
  }

  const deleteDiscount = async (d: Discount) => {
    const ok = confirm('Delete this discount?')
    if (!ok) return
    const prev = discounts
    setDiscounts(discounts.filter(x => x.id !== d.id))
    const res = await fetch(`/api/admin/discounts/${d.id}`, { method: 'DELETE' })
    if (!res.ok) setDiscounts(prev)
  }

  const openAssign = async (d: Discount) => {
    setAssignFor(d)
    setAssignOpen(true)
    setAssignLoading(true)
    try {
      const res = await fetch(`/api/admin/discounts/${d.id}/products`)
      const json = await res.json()
      setAssigned(json.products || [])
    } finally {
      setAssignLoading(false)
    }
  }

  const runSearch = async (pageOverride?: number) => {
    setSearchLoading(true)
    try {
      const page = pageOverride ?? resultsPage
      const res = await fetch(`/api/admin/discounts/products?q=${encodeURIComponent(search)}&page=${page}&limit=${resultsLimit}`)
      const json = await res.json()
      setResults(json.products || [])
      setResultsTotal(json.total || 0)
      if (pageOverride) setResultsPage(page)
    } finally {
      setSearchLoading(false)
    }
  }

  const confirmAssignAll = async () => {
    if (!assignFor) return
    setBulkAssignLoading(true)
    try {
      await fetch(`/api/admin/discounts/${assignFor.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assign_all: true })
      })
      setConfirmAllOpen(false)
      setAssignOpen(false)
    } finally {
      setBulkAssignLoading(false)
    }
  }

  const confirmUnassignAll = async () => {
    if (!assignFor) return
    setBulkAssignLoading(true)
    try {
      await fetch(`/api/admin/discounts/${assignFor.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remove_all: true })
      })
      setConfirmUnassignAllOpen(false)
      setAssigned([])
    } finally {
      setBulkAssignLoading(false)
    }
  }

  const addProduct = (p: Product) => {
    if (assignedIds.has(p.id)) return
    setAssigned(prev => [...prev, p])
  }

  const removeProduct = (p: Product) => {
    setAssigned(prev => prev.filter(x => x.id !== p.id))
  }

  const saveAssigned = async () => {
    if (!assignFor) return
    setAssignLoading(true)
    try {
      const currentRes = await fetch(`/api/admin/discounts/${assignFor.id}/products`)
      const currentJson = await currentRes.json()
      const current: Product[] = currentJson.products || []
      const currentIds = new Set(current.map(p => p.id))
      const newIds = new Set(assigned.map(p => p.id))
      const add: string[] = []
      const remove: string[] = []
      for (const id of newIds) if (!currentIds.has(id)) add.push(id)
      for (const id of currentIds) if (!newIds.has(id)) remove.push(id)

      await fetch(`/api/admin/discounts/${assignFor.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add, remove }),
      })
      setAssignOpen(false)
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Discounts</h1>
          <p className="text-black/70">Create percentage promotions and assign products.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <Button variant="outline" onClick={blackFridayPreset} className="w-full sm:w-auto text-sm whitespace-nowrap">
            <span className="sm:hidden">Black Friday</span>
            <span className="hidden sm:inline">Black Friday Preset</span>
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto text-sm bg-black text-white hover:bg-primary hover:text-foreground">
            <Plus className="w-4 h-4 mr-2" /> New Discount
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">All Discounts</h2>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-foreground/70">Loading...</div>
        ) : discounts.length === 0 ? (
          <div className="p-6 text-sm text-foreground/70">No discounts yet.</div>
        ) : (
          <div className="divide-y">
            {discounts.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4">
                <div className="space-y-1 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-semibold break-words">{d.name}</p>
                    {d.active ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 whitespace-nowrap">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 whitespace-nowrap">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/70">{d.percentage}% • {d.starts_at ? new Date(d.starts_at).toLocaleDateString() : 'No start'} → {d.ends_at ? new Date(d.ends_at).toLocaleDateString() : 'No end'}</p>
                </div>
                <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-2">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toggleActive(d)}>
                    {d.active ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    {d.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => openAssign(d)}>
                    Assign Products
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteDiscount(d)} className="w-full sm:w-auto text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Discount</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 ">Name</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Black Friday" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
              <Input type="number" step="0.01" value={form.percentage} onChange={(e) => setForm((p) => ({ ...p, percentage: e.target.value }))} placeholder="e.g. 20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <select className="h-10 w-full rounded-md border px-3 text-sm text-black" value={form.active ? '1' : '0'} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === '1' }))}>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
              <Input type="date" value={form.starts_at} onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
              <Input type="date" value={form.ends_at} onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createDiscount} disabled={creating} className="bg-black text-white hover:bg-primary hover:text-foreground">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Products</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" onClick={() => runSearch(1)} disabled={searchLoading}>
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={() => setConfirmAllOpen(true)} disabled={searchLoading}>
                  Assign All
                </Button>
              </div>
              <div className="border rounded-md divide-y max-h-64 overflow-auto">
                {results.map((p) => (
                  <button key={p.id} className="w-full text-left text-black px-3 py-2 hover:bg-gray-50" onClick={() => addProduct(p)} disabled={assignedIds.has(p.id)}>
                    {p.name}
                  </button>
                ))}
                {results.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No results</div>}
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-600">Page {resultsPage} of {Math.max(1, Math.ceil(resultsTotal / resultsLimit))}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={resultsPage <= 1 || searchLoading} onClick={() => runSearch(resultsPage - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={resultsPage >= Math.max(1, Math.ceil(resultsTotal / resultsLimit)) || searchLoading} onClick={() => runSearch(resultsPage + 1)}>Next</Button>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-black">Assigned</div>
                <Button variant="outline" onClick={() => setConfirmUnassignAllOpen(true)} disabled={searchLoading}>
                  Unassign All
                </Button>
              </div>
              <div className="border rounded-md divide-y max-h-64 overflow-auto">
                {assignLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                ) : assigned.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No products assigned</div>
                ) : (
                  assigned.map((p) => (
                    <div key={p.id} className="flex items-center text-black justify-between px-3 py-2">
                      <span>{p.name}</span>
                      <Button variant="outline" className='text-white' size="sm" onClick={() => removeProduct(p)}>
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Close</Button>
            <Button onClick={saveAssigned} className="bg-black text-white hover:bg-primary hover:text-foreground">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to all products?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">This will assign the selected discount to the entire catalog. Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAllOpen(false)}>Cancel</Button>
            <Button onClick={confirmAssignAll} disabled={bulkAssignLoading} className="bg-black text-white hover:bg-primary hover:text-foreground">
              {bulkAssignLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Assign All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmUnassignAllOpen} onOpenChange={setConfirmUnassignAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from all products?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">This will remove the selected discount from the entire catalog. Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUnassignAllOpen(false)}>Cancel</Button>
            <Button onClick={confirmUnassignAll} disabled={bulkAssignLoading} className="bg-black text-white hover:bg-primary hover:text-foreground">
              {bulkAssignLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Unassign All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
