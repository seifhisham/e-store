import { createClient } from '@/lib/supabase/server'
import OrderStatusSelect from '@/components/admin/OrderStatusSelect'
import { Package, Search as SearchIcon, X as XIcon } from 'lucide-react'
import { updateOrderStatus } from './actions'
import AdminOrdersClient from '@/components/admin/AdminOrdersClient'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminOrdersPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const supabase = await createClient()

  const sp = (await searchParams) || {}
  const status = (sp.status || 'all') as string
  const q = (sp.q || '').trim()
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const perPage = 10
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Build base query with count
  let query = supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      status,
      shipping_address,
      guest_email,
      created_at,
      user_id,
      order_items(
        id,
        quantity,
        price_at_purchase,
        product:products(name),
        variant:product_variants(size, color)
      )
    `, { count: 'exact' })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Search by order id (exact match when likely UUID) or by email (guest_email or shipping_address.email)
  if (q) {
    const isUuidLike = /[a-f0-9-]{8,}/i.test(q)
    const orParts = [
      `guest_email.ilike.%${q}%`,
      `shipping_address->>email.ilike.%${q}%`,
    ] as string[]
    if (isUuidLike) {
      orParts.push(`id.eq.${q}`)
    }
    query = query.or(orParts.join(','))
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data: orders, count } = await query

  const normalizedOrders = (orders || []).map((o: any) => ({
    ...o,
    order_items: (o.order_items || []).map((it: any) => ({
      ...it,
      product: Array.isArray(it.product) ? (it.product[0] ?? null) : it.product,
      variant: Array.isArray(it.variant) ? (it.variant[0] ?? null) : it.variant,
    })),
  }))

  // Helpers to build links preserving q/status
  const buildLink = (updates: Partial<Record<string, string | number>>) => {
    const params = new URLSearchParams()
    // Always use the new status if provided, otherwise fall back to current status
    const newStatus = 'status' in updates ? updates.status : status
    if (newStatus && newStatus !== 'all') params.set('status', String(newStatus))
    // Only include search query if it's not being cleared
    if (q && !('q' in updates)) params.set('q', q)
    // Use provided page or default to 1 for status changes, current page otherwise
    const nextPage = 'page' in updates ? updates.page : ('status' in updates ? 1 : page)
    if (nextPage) params.set('page', String(nextPage))
    return `/admin/orders${params.toString() ? `?${params.toString()}` : ''}`
  }

  const statuses: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const totalPages = Math.max(1, Math.ceil((count || 0) / perPage))
  const hasFilters = (status && status !== 'all') || !!q

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage customer orders and fulfillment</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s) => (
            <Link
              key={s.value}
              href={buildLink({ status: s.value, page: 1 })}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                status === s.value
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              } transition-colors`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <div className="w-full">
          <form method="get" className="flex flex-wrap items-center gap-2 w-full">
            <div className="flex-1 min-w-[200px] max-w-full">
              <input
                type="text"
                name="q"
                defaultValue={q || ''}
                placeholder="Search order ID or email"
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            {status && status !== 'all' && <input type="hidden" name="status" value={status} />}
            <div className="flex gap-2">
              <button 
                className="h-10 px-4 rounded-md bg-black text-white text-sm border border-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 inline-flex items-center justify-center gap-2 whitespace-nowrap" 
                type="submit"
              >
                <SearchIcon className="w-4 h-4" />
                <span>Search</span>
              </button>
              <Link
                href="/admin/orders"
                className={`h-10 px-4 rounded-md border text-sm text-gray-700 bg-white hover:text-black hover:border-black hover:bg-gray-50 shadow-sm inline-flex items-center justify-center gap-2 whitespace-nowrap ${
                  hasFilters ? '' : 'pointer-events-none opacity-50'
                }`}
              >
                <XIcon className="w-4 h-4" />
                <span>Clear</span>
              </Link>
            </div>
          </form>
        </div>
      </div>

      {normalizedOrders && normalizedOrders.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {normalizedOrders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Order</div>
                    <div className="text-sm font-semibold text-gray-900">{order.id.slice(0, 8)}...</div>
                  </div>
                  <div className="min-w-[140px]">
                    <OrderStatusSelect
                      action={updateOrderStatus.bind(null, order.id)}
                      defaultValue={order.status}
                      name="status"
                      className="text-sm"
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'processing', label: 'Processing' },
                        { value: 'shipped', label: 'Shipped' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' },
                      ]}
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Customer</div>
                    <div className="font-medium text-gray-900">{order.shipping_address?.firstName} {order.shipping_address?.lastName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date</div>
                    <div className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Items</div>
                    <div className="font-medium text-gray-900">{order.order_items?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total</div>
                    <div className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <AdminOrdersClient order={order} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {normalizedOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.id.slice(0, 8)}...</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{order.shipping_address?.firstName} {order.shipping_address?.lastName}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{order.order_items?.length || 0} items</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-3 whitespace-nowrap min-w-[160px]">
                        <OrderStatusSelect
                          action={updateOrderStatus.bind(null, order.id)}
                          defaultValue={order.status}
                          name="status"
                          className="text-sm md:w-[160px]"
                          options={[
                            { value: 'pending', label: 'Pending' },
                            { value: 'processing', label: 'Processing' },
                            { value: 'shipped', label: 'Shipped' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                          ]}
                        />
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium"><AdminOrdersClient order={order} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-xs text-gray-600">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <Link
                href={buildLink({ page: Math.max(1, page - 1) })}
                className={`px-3 py-1.5 rounded-md border text-black hover:text-foreground hover:border-black text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                Previous
              </Link>
              <Link
                href={buildLink({ page: Math.min(totalPages, page + 1) })}
                className={`px-3 py-1.5 rounded-md border text-black hover:text-foreground hover:border-black text-sm ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500">Orders will appear here when customers make purchases</p>
          </div>
        </div>
      )}
    </div>
  )
}
