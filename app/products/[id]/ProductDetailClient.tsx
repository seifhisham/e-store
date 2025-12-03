'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { Minus, Plus, Heart, Share2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getColorHex } from '@/lib/colors'

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
  discountPercent?: number
}

export function ProductDetailClient({ product, discountPercent = 0 }: ProductDetailClientProps) {
  const { addToCart } = useCart()
  const firstAvailable = product.variants.find(v => (v.stock_quantity || 0) > 0) || product.variants[0]
  const [selectedVariant, setSelectedVariant] = useState(firstAvailable)
  const [selectedSize, setSelectedSize] = useState(firstAvailable?.size || '')
  const [selectedColor, setSelectedColor] = useState(firstAvailable?.color || '')
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [mainAspectRatio, setMainAspectRatio] = useState<string | null>(null)

  const sortedImages = [...product.images].sort((a, b) => a.display_order - b.display_order)
  const price = product.base_price + (selectedVariant?.price_adjustment || 0)
  const discountedPrice = discountPercent > 0 ? Math.max(0, price * (1 - discountPercent / 100)) : price

  const sizes = useMemo(() => Array.from(new Set(product.variants.map(v => v.size))), [product.variants])
  const colorsForSelectedSize = useMemo(() => {
    return Array.from(new Set(product.variants.filter(v => v.size === selectedSize).map(v => v.color)))
  }, [product.variants, selectedSize])

  const allOutOfStock = product.variants.length > 0 && product.variants.every(v => (v.stock_quantity || 0) <= 0)

  const isSizeOutOfStock = (size: string) => {
    return product.variants.filter(v => v.size === size).every(v => (v.stock_quantity || 0) <= 0)
  }

  const getVariant = (size: string, color: string) => {
    return product.variants.find(v => v.size === size && v.color === color)
  }

  const isColorUnavailable = (size: string, color: string) => {
    const v = getVariant(size, color)
    return !v || (v.stock_quantity || 0) <= 0
  }

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    
    // If current selection is out of stock but some other variant is available, switch to it
    let variant = selectedVariant
    if ((variant.stock_quantity || 0) <= 0) {
      const available = product.variants.find(v => (v.stock_quantity || 0) > 0)
      if (!available) {
        return
      }
      setSelectedVariant(available)
      setSelectedSize(available.size)
      setSelectedColor(available.color)
      variant = available
      // Reset quantity within stock
      if (quantity > (variant.stock_quantity || 0)) {
        setQuantity(1)
      }
    }

    setIsAdding(true)
    try {
      await addToCart(product.id, variant.id, quantity)
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
        <div
          className="relative overflow-hidden rounded-lg"
          style={{ aspectRatio: mainAspectRatio || '1 / 1' }}
        >
          <Image
            src={sortedImages[selectedImageIndex]?.image_url || '/placeholder.jpg'}
            alt={product.name}
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain"
            key={sortedImages[selectedImageIndex]?.image_url || 'placeholder'}
            onLoadingComplete={(img) => {
              const w = img.naturalWidth || 1
              const h = img.naturalHeight || 1
              setMainAspectRatio(`${w} / ${h}`)
            }}
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
          <h1 className="text-3xl font-bold text-black mb-2">{product.name}</h1>
          <p className="text-lg text-black/80">{product.category}</p>
        </div>

        <div className="flex items-center space-x-4">
          {discountPercent > 0 ? (
            <>
              <span className="text-3xl font-bold text-black">{formatCurrency(discountedPrice)}</span>
              <span className="text-lg text-black/60 line-through">{formatCurrency(price)}</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-black text-white">-{Math.round(discountPercent)}%</span>
            </>
          ) : (
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(price)}</span>
          )}
        </div>

        <p className="text-black leading-relaxed">{product.description}</p>

        {/* Variant Selection */}
        {product.variants.length > 0 && (
          <div className="space-y-6">
            {/* Sizes */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Size</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const disabled = isSizeOutOfStock(size)
                  const isActive = selectedSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        if (disabled) return
                        setSelectedSize(size)
                        // Try keep color; if invalid or OOS, pick first available color for this size
                        let color = selectedColor
                        let v = getVariant(size, color)
                        if (!v || (v.stock_quantity || 0) <= 0) {
                          const firstAvailable = product.variants.find(x => x.size === size && (x.stock_quantity || 0) > 0)
                          color = firstAvailable?.color || (colorsForSelectedSize[0] || '')
                          v = firstAvailable || (color ? getVariant(size, color) || undefined : undefined)
                        }
                        if (v) {
                          setSelectedColor(v.color)
                          setSelectedVariant(v)
                          setQuantity(1)
                        }
                      }}
                      className={`px-3 py-2 rounded-full border text-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black ${
                        disabled
                          ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed relative overflow-hidden before:content-[""] before:absolute before:top-1/2 before:left-1/2 before:w-[calc(100%+8px)] before:h-[1.5px] before:bg-gray-300 before:transform before:-translate-x-1/2 before:-translate-y-1/2 before:origin-center before:rotate-[-30deg] before:z-10 before:opacity-90 before:transition-opacity hover:before:opacity-100'
                          : isActive
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-black border-gray-300 hover:border-black hover:shadow-sm'
                      }`}
                      aria-pressed={isActive}
                      aria-disabled={disabled}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Color</label>
              <div className="flex flex-wrap gap-3">
                {colorsForSelectedSize.map((color) => {
                  const disabled = isColorUnavailable(selectedSize, color)
                  const isActive = selectedColor === color
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        if (disabled) return
                        setSelectedColor(color)
                        const v = getVariant(selectedSize, color)
                        if (v) {
                          setSelectedVariant(v)
                          setQuantity(1)
                        }
                      }}
                      className={`group inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-black ${
                        disabled
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : isActive
                            ? 'bg-white text-black border-black'
                            : 'bg-white text-black border-gray-300 hover:border-black'
                      }`}
                      aria-pressed={isActive}
                      aria-disabled={disabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full border ${isActive ? 'border-black' : 'border-gray-300'} ${disabled ? 'opacity-40' : ''}`}
                        style={{ backgroundColor: getColorHex(color) }}
                        aria-hidden
                      />
                      <span>{color}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quantity Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-black">
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
            <span className="w-12 text-center font-medium text-black">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= (selectedVariant?.stock_quantity || 0)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleAddToCart}
            disabled={allOutOfStock || isAdding}
            className="w-full bg-black text-white hover:bg-primary hover:text-foreground"
            size="lg"
          >
            {isAdding ? 'Adding to Cart...' : allOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </Button>
          
          {/* <div className="flex space-x-4">
            <Button variant="outline" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div> */}
        </div>

        {/* Product Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-black mb-4">Product Details</h3>
          <div className="space-y-2 text-sm text-black/80">
            <div className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium">{product.category}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span className="font-medium">{formatCurrency(product.base_price)}</span>
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
