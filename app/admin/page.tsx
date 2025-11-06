import { createClient } from '@/lib/supabase/server'
import { Package, ShoppingCart, Users, DollarSign, Clock, Loader2, Truck, CheckCircle2, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Fetch dashboard statistics
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: totalCustomers },
    { data: recentOrders }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('user_id', { count: 'exact', head: true }),
    supabase.from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  // Calculate total revenue
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'completed')

  const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

  // Time windows
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Revenue windows + completed count
  const [
    { data: rev7 },
    { data: rev30 },
    { count: completedOrdersCount },
  ] = await Promise.all([
    supabase.from('orders').select('total_amount, created_at').eq('status', 'completed').gte('created_at', sevenDaysAgo),
    supabase.from('orders').select('total_amount, created_at').eq('status', 'completed').gte('created_at', thirtyDaysAgo),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  const revenue7d = rev7?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0
  const revenue30d = rev30?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0
  const aov = completedOrdersCount ? totalRevenue / completedOrdersCount : 0

  // Orders by status counts
  const [
    pendingRes,
    processingRes,
    shippedRes,
    completedRes,
    cancelledRes,
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'shipped'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ])

  const ordersByStatus = {
    pending: pendingRes?.count || 0,
    processing: processingRes?.count || 0,
    shipped: shippedRes?.count || 0,
    completed: completedRes?.count || 0,
    cancelled: cancelledRes?.count || 0,
  }

  const statusCards = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', count: ordersByStatus.pending },
    { key: 'processing', label: 'Processing', icon: Loader2, color: 'text-blue-700', bg: 'bg-blue-50', count: ordersByStatus.processing },
    { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-indigo-700', bg: 'bg-indigo-50', count: ordersByStatus.shipped },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', count: ordersByStatus.completed },
    { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-rose-700', bg: 'bg-rose-50', count: ordersByStatus.cancelled },
  ]

  // Top products in last 30 days (by revenue)
  const { data: completed30 } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'completed')
    .gte('created_at', thirtyDaysAgo)

  const completedIds = (completed30 || []).map(o => o.id)
  let topProducts: Array<{ id: string; name: string; units: number; revenue: number }> = []
  if (completedIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity, price_at_purchase, product:products(name)')
      .in('order_id', completedIds)

    const agg = new Map<string, { id: string; name: string; units: number; revenue: number }>()
    for (const it of items || []) {
      const pid = it.product_id as string
      const pname = Array.isArray((it as any).product) ? (it as any).product[0]?.name : (it as any).product?.name
      const entry = agg.get(pid) || { id: pid, name: pname || 'Unknown', units: 0, revenue: 0 }
      entry.units += it.quantity || 0
      entry.revenue += ((it.price_at_purchase || 0) * (it.quantity || 0))
      agg.set(pid, entry)
    }
    topProducts = Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }

  const stats = [
    {
      name: 'Total Products',
      value: totalProducts || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Orders',
      value: totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total Customers',
      value: totalCustomers || 0,
      icon: Users,
      color: 'text-black',
      bgColor: 'bg-gray-200'
    },
    {
      name: 'Total Revenue',
      value: `${formatCurrency(totalRevenue)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Revenue (7d)',
      value: `${formatCurrency(revenue7d)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      name: 'Avg Order Value',
      value: `${formatCurrency(aov)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Dashboard</h1>
        <p className="text-black/80">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-black/5 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bgColor} ring-1 ring-black/5`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-foreground/70">{stat.name}</p>
                <p className="text-3xl font-semibold text-foreground tracking-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statusCards.map((card) => (
          <div key={card.key} className="rounded-xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center">
              <div className={`p-2.5 rounded-full ${card.bg} ring-1 ring-black/5`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-foreground/70">{card.label}</p>
                <p className="text-xl font-semibold text-foreground">{card.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Products (30d) */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Top Products (30d)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-foreground/10">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">Units</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-foreground/10">
              {topProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50/60">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/70">#{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{p.units}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-foreground/80" colSpan={4}>No data in the last 30 days</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-foreground/50">
            <thead className="bg-foreground/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-foreground/50">
              {recentOrders?.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-foreground/10 text-foreground'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
