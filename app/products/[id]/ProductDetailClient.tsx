'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import Image from 'next/image'
import { Minus, Plus, Heart, Share2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  category: string
  images: { image_url: string; is_primary: boolean; display_order: number }[]
  variants: {
    id: string
    size: string
    color: string
    price_adjustment: number
    stock_quantity: number
  }[]
}

interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)

  const sortedImages = [...product.images].sort((a, b) => a.display_order - b.display_order)
  const price = product.base_price + (selectedVariant?.price_adjustment || 0)

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    
    setIsAdding(true)
    try {
      await addToCart(product.id, selectedVariant.id, quantity)
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (selectedVariant?.stock_quantity || 0)) {
      setQuantity(newQuantity)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square relative overflow-hidden rounded-lg">
          <Image
            src={sortedImages[selectedImageIndex]?.image_url || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* Thumbnail Images */}
        {sortedImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {sortedImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square relative overflow-hidden rounded-md border-2 ${
                  selectedImageIndex === index ? 'border-gray-900' : 'border-gray-200'
                }`}
              >
                <Image
                  src={image.image_url}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-lg text-gray-600">{product.category}</p>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-3xl font-bold text-gray-900">${price.toFixed(2)}</span>
          {selectedVariant?.price_adjustment !== 0 && (
            <span className="text-lg text-gray-500 line-through">
              ${product.base_price.toFixed(2)}
            </span>
          )}
        </div>

        <p className="text-gray-700 leading-relaxed">{product.description}</p>

        {/* Variant Selection */}
        {product.variants.length > 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size & Color
              </label>
              <Select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const variant = product.variants.find(v => v.id === e.target.value)
                  if (variant) {
                    setSelectedVariant(variant)
                    setQuantity(1)
                  }
                }}
                className="w-full"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.size} - {variant.color} 
                    {variant.stock_quantity === 0 ? ' (Out of Stock)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Quantity Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= (selectedVariant?.stock_quantity || 0)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            {selectedVariant?.stock_quantity || 0} available
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock_quantity === 0 || isAdding}
            className="w-full"
            size="lg"
          >
            {isAdding ? 'Adding to Cart...' : 
             selectedVariant?.stock_quantity === 0 ? 'Out of Stock' : 
             'Add to Cart'}
          </Button>
          
          <div className="flex space-x-4">
            <Button variant="outline" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Product Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span className="font-medium">${product.base_price.toFixed(2)}</span>
            </div>
            {selectedVariant && (
              <>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium">{selectedVariant.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span className="font-medium">{selectedVariant.color}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
