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
  isNew?: boolean
  showActions?: boolean
}

export function ProductCard({ product, isNew, showActions = true }: ProductCardProps) {
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
    <article className="group relative bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <Link href={`/products/${product.id}`} aria-label={`View details for ${product.name}`}>
        <div className="aspect-[3/4] relative overflow-hidden bg-neutral-100">
          {isNew && (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white" aria-label="New product">
              New
            </span>
          )}
          <Image
            src={primaryImage?.image_url || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </div>
      </Link>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
          <h3 className="font-semibold text-black line-clamp-2">
            <Link href={`/products/${product.id}`} className="hover:text-black" aria-label={`View details for ${product.name}`}>
              {product.name}
            </Link>
          </h3>
          <span className="mt-1 block text-base font-medium text-black">
            {formatCurrency(price)}
          </span>
        </div>
        
        {showActions && (
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
              aria-label={`Add ${product.name} to cart`}
            >
              {isAdding ? 'Adding...' : 
               selectedVariant?.stock_quantity === 0 ? 'Out of Stock' : 
               'Add to Cart'}
            </Button>
          ) : (
            <Link href={`/products/${product.id}`}>
              <Button className="w-full" size="sm" variant="outline" aria-label={`View details for ${product.name}`}>
                View Details
              </Button>
            </Link>
          )}
        </div>
        )}
      </div>
    </article>
  )
}
