'use client'

import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useState } from 'react'

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, loading } = useCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link href="/products">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {items.map((item) => {
                const isUpdating = updatingItems.has(item.id)
                const price = item.product.base_price + item.variant.price_adjustment
                
                return (
                  <div key={item.id} className="p-6 border-b last:border-b-0">
                    <div className="flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 relative overflow-hidden rounded-md">
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
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link href={`/products/${item.product.id}`} className="hover:text-indigo-600">
                            {item.product.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.variant.size} - {item.variant.color}
                        </p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          ${price.toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {getTotalPrice() >= 50 ? 'Free' : '$9.99'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${(getTotalPrice() * 0.08).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>
                      ${(getTotalPrice() + (getTotalPrice() >= 50 ? 0 : 9.99) + (getTotalPrice() * 0.08)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link href="/checkout" className="block">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link href="/products" className="block">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
              
              {getTotalPrice() < 50 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Add ${(50 - getTotalPrice()).toFixed(2)} more for free shipping!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
