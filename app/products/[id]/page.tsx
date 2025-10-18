import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useCart } from '@/contexts/CartContext'
import { ProductDetailClient } from './ProductDetailClient'
import Image from 'next/image'
import { notFound } from 'next/navigation'

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = await createClient()
  
  // Fetch product details
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      base_price,
      category,
      images:product_images(image_url, is_primary, display_order),
      variants:product_variants(id, size, color, price_adjustment, stock_quantity)
    `)
    .eq('id', params.id)
    .single()

  if (error || !product) {
    notFound()
  }

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      base_price,
      category,
      images:product_images(image_url, is_primary),
      variants:product_variants(id, size, color, price_adjustment, stock_quantity)
    `)
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(4)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetailClient product={product} />
        
        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
