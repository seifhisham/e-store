'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Package, Eye, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import Dialog, { DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/Dialog'

interface Order {
  id: string
  total_amount: number
  status: string
  shipping_address: any
  created_at: string
  order_items: {
    id: string
    quantity: number
    price_at_purchase: number
    product: {
      name: string
    }
    variant: {
      size: string
      color: string
    }
  }[]
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          shipping_address,
          created_at,
          order_items(
            id,
            quantity,
            price_at_purchase,
            product:products(name),
            variant:product_variants(size, color)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data as unknown as Order[]) || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view orders</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view your order history.</p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id.slice(0, 36)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-900">
                            {item.product.name} ({item.variant.size}, {item.variant.color}) x {item.quantity}
                          </span>
                          <span className="font-medium text-black">
                            {formatCurrency(item.price_at_purchase * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order)
                        setOpen(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <Link href="/products">
              <Button className="bg-black text-white hover:bg-primary hover:text-foreground">Start Shopping</Button>
            </Link>
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          {selectedOrder && (
            <div>
              <DialogHeader>
                <DialogTitle>
                  Order #{selectedOrder.id.slice(0, 8)}...
                </DialogTitle>
                <DialogDescription>
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedOrder.total_amount)}
                  </span>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-900">
                          {item.product.name} ({item.variant.size}, {item.variant.color}) x {item.quantity}
                        </span>
                        <span className="font-medium text-black">
                          {formatCurrency(item.price_at_purchase * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>
                      {(selectedOrder.shipping_address?.firstName || selectedOrder.shipping_address?.lastName) && (
                        <span>
                          {selectedOrder.shipping_address?.firstName} {selectedOrder.shipping_address?.lastName}
                        </span>
                      )}
                    </div>
                    <div>{selectedOrder.shipping_address?.address}</div>
                    <div>
                      {selectedOrder.shipping_address?.city}{selectedOrder.shipping_address?.state ? `, ${selectedOrder.shipping_address?.state}` : ''}
                    </div>
                    <div>
                      {selectedOrder.shipping_address?.country}{selectedOrder.shipping_address?.zipCode ? `, ${selectedOrder.shipping_address?.zipCode}` : ''}
                    </div>
                    <div className="text-gray-600">
                      {selectedOrder.shipping_address?.email}
                      {selectedOrder.shipping_address?.phone ? ` • ${selectedOrder.shipping_address?.phone}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <DialogClose className="px-3 py-2 rounded-md border text-sm text-black hover:bg-black hover:text-white">Close</DialogClose>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
