'use client'

import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, loading } = useCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const shipping = 80

  const [discounts, setDiscounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const run = async () => {
      if (!items || items.length === 0) {
        setDiscounts({})
        return
      }
      const productIds = Array.from(new Set(items.map(i => i.product_id)))
      const res = await fetch('/api/discounts/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds }),
      })
      const json = await res.json()
      setDiscounts(json.percents || {})
    }
    run()
  }, [items])

  const discountedSubtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const base = (item.product.base_price || 0) + (item.variant.price_adjustment || 0)
      const percent = discounts[item.product_id] || 0
      const unit = percent > 0 ? Math.max(0, base * (1 - percent / 100)) : base
      return total + unit * item.quantity
    }, 0)
  }, [items, discounts])

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await updateQuantity(itemId, newQuantity)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await removeFromCart(itemId)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-black">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="w-24 h-24 text-black mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-black mb-4">Your cart is empty</h1>
            <p className="text-black mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link href="/products">
              <Button size="lg" className="w-full bg-black text-white hover:bg-primary hover:text-foreground">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {items.map((item) => {
                const isUpdating = updatingItems.has(item.id)
                const base = item.product.base_price + item.variant.price_adjustment
                const percent = discounts[item.product.id] || 0
                const price = percent > 0 ? Math.max(0, base * (1 - percent / 100)) : base
                
                return (
                  <div key={item.id} className="p-4 sm:p-6 border-b last:border-b-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 self-start">
                        <div className="w-24 h-24 sm:w-20 sm:h-20 relative overflow-hidden rounded-md">
                          <Image
                            src={item.product.images.find(img => img.is_primary)?.image_url || '/placeholder.jpg'}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-black break-words">
                          <Link href={`/products/${item.product.id}`} className="hover:text-primary">
                            {item.product.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-black whitespace-normal">
                          {item.variant.size} - {item.variant.color}
                        </p>
                        <div className="text-base sm:text-lg font-semibold text-black mt-1">
                          {percent > 0 ? (
                            <div className="flex items-baseline gap-2">
                              <span>{formatCurrency(price)}</span>
                              <span className="text-sm text-black/60 line-through">{formatCurrency(base)}</span>
                            </div>
                          ) : (
                            <span>{formatCurrency(price)}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="mt-2 sm:mt-0 flex items-center gap-3 sm:ml-auto self-start sm:self-auto">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="px-3 py-1 text-sm text-black font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.variant.stock_quantity || isUpdating}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-black mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-black">Subtotal</span>
                  <span className="font-medium text-black">{formatCurrency(discountedSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black">Shipping</span>
                  <span className="font-medium text-black">{formatCurrency(shipping)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold text-black">
                    <span>Total</span>
                    <span>{formatCurrency(discountedSubtotal + shipping)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link href="/checkout" className="block">
                  <Button className="w-full bg-black text-white hover:bg-primary hover:text-foreground" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link href="/products" className="block">
                  <Button className="w-full bg-black text-white hover:bg-primary hover:text-foreground">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
              

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
