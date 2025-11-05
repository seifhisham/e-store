'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Eye } from 'lucide-react'
import Dialog, { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/Dialog'
import { formatCurrency } from '@/lib/utils'

type OrderItem = {
  id: string
  quantity: number
  price_at_purchase: number
  product?: { name?: string | null } | null
  variant?: { size?: string | null; color?: string | null } | null
}

type ShippingAddress = {
  firstName?: string
  lastName?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

type Order = {
  id: string
  total_amount: number
  status: string
  created_at: string
  user_id?: string
  shipping_address?: ShippingAddress | null
  order_items: OrderItem[]
}

interface AdminOrdersClientProps {
  order: Order
}

export default function AdminOrdersClient({ order }: AdminOrdersClientProps) {
  const [open, setOpen] = useState(false)

  const fullName = `${order.shipping_address?.firstName ?? ''} ${order.shipping_address?.lastName ?? ''}`.trim()
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : ''

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Eye className="w-4 h-4 mr-1" />
        View
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {order.id}</DialogTitle>
            <DialogDescription>{orderDate}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Customer</div>
                <div className="font-medium text-gray-900">{fullName || '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Status</div>
                <div className="font-medium capitalize text-gray-900">{order.status}</div>
              </div>
              <div>
                <div className="text-gray-600">Order Total</div>
                <div className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</div>
              </div>
              <div>
                <div className="text-gray-600">Order ID</div>
                <div className="font-mono text-gray-900 text-xs break-all">{order.id}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
              <div className="text-sm text-gray-800 space-y-0.5">
                <div>{fullName || '—'}</div>
                <div>{order.shipping_address?.address1 || '—'}</div>
                {order.shipping_address?.address2 ? <div>{order.shipping_address.address2}</div> : null}
                <div>
                  {[order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.postalCode]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </div>
                <div>{order.shipping_address?.country || '—'}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Items Ordered</h4>
              <div className="space-y-2">
                {order.order_items?.length ? (
                  order.order_items.map((item) => {
                    const lineTotal = (item.price_at_purchase || 0) * (item.quantity || 0)
                    const variant = [item.variant?.size, item.variant?.color].filter(Boolean).join(', ')
                    return (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="text-gray-900">
                          {item.product?.name || 'Item'}
                          {variant ? ` (${variant})` : ''} x {item.quantity}
                        </div>
                        <div className="font-medium text-black">{formatCurrency(lineTotal)}</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-gray-500">No items</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose className="h-9 rounded-md px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}



