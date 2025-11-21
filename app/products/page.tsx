import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { ProductsToolbar } from '@/components/ProductsToolbar'
import { getActiveDiscountPercent } from '@/lib/discounts'


interface SearchParams {
  category?: string
  minPrice?: string
  maxPrice?: string
  size?: string
  color?: string
  search?: string
  page?: string
  pageSize?: string
  availability?: string
  priceRange?: string
  sort?: string
}

interface ProductsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams
  const supabase = await createClient()

  // Build query based on search params
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      base_price,
      category,
      images:product_images(image_url, is_primary),
      variants:product_variants(id, size, color, price_adjustment, stock_quantity)
    `, { count: 'exact' })

  // Apply filters
  if (sp.category) {
    query = query.eq('category', sp.category)
  }

  // Map priceRange -> min/max if provided
  if (sp.priceRange) {
    const map: Record<string, { min?: number; max?: number }> = {
      '0-500': { min: 0, max: 500 },
      '500-1000': { min: 500, max: 1000 },
      '1000-2000': { min: 1000, max: 2000 },
      '2000+': { min: 2000 },
    }
    const r = map[sp.priceRange]
    if (r) {
      if (typeof r.min === 'number') query = query.gte('base_price', r.min)
      if (typeof r.max === 'number') query = query.lte('base_price', r.max)
    }
  }

  if (sp.minPrice) {
    query = query.gte('base_price', sp.minPrice)
  }

  if (sp.maxPrice) {
    query = query.lte('base_price', sp.maxPrice)
  }

  if (sp.search) {
    query = query.ilike('name', `%${sp.search}%`)
  }

  // Availability: in_stock => product ids with any variant stock_quantity > 0
  if (sp.availability === 'in_stock') {
    const { data: idsRows } = await supabase
      .from('product_variants')
      .select('product_id')
      .gt('stock_quantity', 0)
    const ids = Array.from(new Set((idsRows || []).map(r => r.product_id).filter(Boolean)))
    if (ids.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ProductsToolbar initial={sp} count={0} />
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-black" />
              <h3 className="text-lg font-medium text-black mb-2">No products found</h3>
              <p className="text-black">Try adjusting your filter criteria</p>
              <div className="mt-4">
                <Link href="/products">
                  <Button variant="outline">Clear Filters</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
    query = query.in('id', ids as string[])
  }

  // Sorting
  switch (sp.sort) {
    case 'name_asc':
      query = query.order('name', { ascending: true })
      break
    case 'name_desc':
      query = query.order('name', { ascending: false })
      break
    case 'price_asc':
      query = query.order('base_price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('base_price', { ascending: false })
      break
    default:
      // Default sort: newest first (created_at not selected here; falls back to name asc)
      query = query.order('name', { ascending: true })
  }

  const page = Math.max(1, parseInt(sp.page || '1'))
  const pageSize = Math.max(1, parseInt(sp.pageSize || '12'))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: products, count } = await query.range(from, to)
  // Resolve discounts for listing cards
  const discountPercents = new Map<string, number>()
  if (products && products.length > 0) {
    await Promise.all(
      products.map(async (p: any) => {
        const d = await getActiveDiscountPercent(p.id)
        discountPercents.set(p.id, d)
      })
    )
  }
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize))

  

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">Products</h1>
        </div>

        {/* Top toolbar */}
        <ProductsToolbar initial={sp} count={count || 0} />

        {/* Products Grid */}
        <div className="mt-6">
            {products && products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} discountPercent={discountPercents.get(product.id) || 0} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4 text-black" />
                  <h3 className="text-lg font-medium text-black mb-2">
                    No products found
                  </h3>
                  <p className="text-black">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
                <Link href="/products">
                  <Button variant="outline">
                    Clear Filters
                  </Button>
                </Link>
              </div>
            )}
            {/* Pagination */}
            <nav className="flex items-center justify-end mt-8 gap-6 select-none">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p) => (
                  <Link
                    key={p}
                    href={{
                      pathname: '/products',
                      query: {
                        category: sp.category || undefined,
                        minPrice: sp.minPrice || undefined,
                        maxPrice: sp.maxPrice || undefined,
                        priceRange: sp.priceRange || undefined,
                        availability: sp.availability || undefined,
                        sort: sp.sort || undefined,
                        size: sp.size || undefined,
                        color: sp.color || undefined,
                        search: sp.search || undefined,
                        page: String(p),
                        pageSize: String(pageSize),
                      },
                    }}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    <span className={`inline-block text-sm text-neutral-900 ${
                      page === p ? 'border-b border-neutral-900 pb-1' : 'hover:text-neutral-950'
                    }`}>
                      {p}
                    </span>
                  </Link>
                ))}

              {page < totalPages && (
                <Link
                  href={{
                    pathname: '/products',
                    query: {
                      category: sp.category || undefined,
                      minPrice: sp.minPrice || undefined,
                      maxPrice: sp.maxPrice || undefined,
                      priceRange: sp.priceRange || undefined,
                      availability: sp.availability || undefined,
                      sort: sp.sort || undefined,
                      size: sp.size || undefined,
                      color: sp.color || undefined,
                      search: sp.search || undefined,
                      page: String(page + 1),
                      pageSize: String(pageSize),
                    },
                  }}
                  aria-label="Next page"
                >
                  <span className="inline-block text-neutral-900">›</span>
                </Link>
              )}
            </nav>
        </div>
      </div>
    </div>
  )
}
