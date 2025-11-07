'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/contexts/CartContext'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  category: string
  images: { image_url: string; is_primary: boolean }[]
  variants: {
    id: string
    size: string
    color: string
    price_adjustment: number
    stock_quantity: number
  }[]
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [isAdding, setIsAdding] = useState(false)

  const hasVariants = product.variants && product.variants.length > 0

  const primaryImage = product.images.find(img => img.is_primary) || product.images[0]
  const price = product.base_price + (selectedVariant?.price_adjustment || 0)

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    setIsAdding(true)
    try {
      await addToCart(product.id, selectedVariant.id, 1)
      toast.success('Added to cart')
    } catch (err) {
      toast.error('Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="group relative bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={primaryImage?.image_url || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-black line-clamp-2">
            <Link href={`/products/${product.id}`} className="hover:text-black">
              {product.name}
            </Link>
          </h3>
          <span className="text-lg font-semibold text-black">
            {formatCurrency(price)}
          </span>
        </div>
        
        <p className="text-sm text-black mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="mt-auto space-y-2">
          {/* {product.variants.length > 1 && (
            <select
              value={selectedVariant?.id || ''}
              onChange={(e) => {
                const variant = product.variants.find(v => v.id === e.target.value)
                if (variant) setSelectedVariant(variant)
              }}
              className="w-full text-sm border border-input bg-background text-black rounded px-2 py-1"
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.size} - {variant.color}
                </option>
              ))}
            </select>
          )} */}

          {hasVariants ? (
            <Button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock_quantity === 0 || isAdding}
              className="w-full bg-black text-white hover:bg-primary hover:text-foreground"
              size="sm"
            >
              {isAdding ? 'Adding...' : 
               selectedVariant?.stock_quantity === 0 ? 'Out of Stock' : 
               'Add to Cart'}
            </Button>
          ) : (
            <Link href={`/products/${product.id}`}>
              <Button className="w-full" size="sm" variant="outline">
                View Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
