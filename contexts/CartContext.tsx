'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthContext'

interface CartItem {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  product: {
    id: string
    name: string
    base_price: number
    images: { image_url: string; is_primary: boolean }[]
  }
  variant: {
    id: string
    size: string
    color: string
    price_adjustment: number
    stock_quantity: number
  }
}

interface CartContextType {
  items: CartItem[]
  loading: boolean
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  const normalizeItem = (item: any): CartItem => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product
    const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
    return { ...item, product, variant } as CartItem
  }

  const getSessionId = () => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('cart_session_id')
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem('cart_session_id', sessionId)
      }
      return sessionId
    }
    return null
  }

  const fetchCartItems = async () => {
    try {
      setLoading(true)
      
      if (user) {
        // Fetch cart items for authenticated user
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            variant_id,
            quantity,
            product:products(id, name, base_price, images:product_images(image_url, is_primary)),
            variant:product_variants(id, size, color, price_adjustment, stock_quantity)
          `)
          .eq('user_id', user.id)

        if (error) throw error
        setItems((data || []).map(normalizeItem))
      } else {
        // Fetch cart items for guest user
        const sessionId = getSessionId()
        if (sessionId) {
          const { data, error } = await supabase
            .from('cart_items')
            .select(`
              id,
              product_id,
              variant_id,
              quantity,
              product:products(id, name, base_price, images:product_images(image_url, is_primary)),
              variant:product_variants(id, size, color, price_adjustment, stock_quantity)
            `)
            .eq('session_id', sessionId)
            .is('user_id', null)

          if (error) throw error
          setItems((data || []).map(normalizeItem))
        }
      }
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCartItems()
  }, [user])

  const addToCart = async (productId: string, variantId: string, quantity = 1) => {
    try {
      const sessionId = getSessionId()
      
      // Check if item already exists in cart
      const existingItem = items.find(
        item => item.product_id === productId && item.variant_id === variantId
      )

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity)
        return
      }

      // Add new item to cart
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user?.id || null,
          session_id: user ? null : sessionId,
          product_id: productId,
          variant_id: variantId,
          quantity,
        })
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          product:products(id, name, base_price, images:product_images(image_url, is_primary)),
          variant:product_variants(id, size, color, price_adjustment, stock_quantity)
        `)
        .single()

      if (error) throw error
      const newItem = normalizeItem(data)
      setItems(prev => [...prev, newItem])
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(cartItemId)
        return
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)

      if (error) throw error
      setItems(prev =>
        prev.map(item =>
          item.id === cartItemId ? { ...item, quantity } : item
        )
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (error) throw error
      setItems(prev => prev.filter(item => item.id !== cartItemId))
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  const clearCart = async () => {
    try {
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const sessionId = getSessionId()
        if (sessionId) {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('session_id', sessionId)
            .is('user_id', null)
          if (error) throw error
        }
      }
      setItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = item.product.base_price + item.variant.price_adjustment
      return total + (price * item.quantity)
    }, 0)
  }

  const value = {
    items,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
