import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Search, Filter } from 'lucide-react'

interface SearchParams {
  category?: string
  minPrice?: string
  maxPrice?: string
  size?: string
  color?: string
  search?: string
  page?: string
  pageSize?: string
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

  if (sp.minPrice) {
    query = query.gte('base_price', sp.minPrice)
  }

  if (sp.maxPrice) {
    query = query.lte('base_price', sp.maxPrice)
  }

  if (sp.search) {
    query = query.ilike('name', `%${sp.search}%`)
  }

  const page = Math.max(1, parseInt(sp.page || '1'))
  const pageSize = Math.max(1, parseInt(sp.pageSize || '12'))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: products, count } = await query.range(from, to)
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize))

  // Get unique categories for filter
  const { data: categories } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)

  const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">All Products</h1>
          <p className="text-black">Discover our complete collection</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>

              <form className="space-y-4">
                <input type="hidden" name="page" value="1" />
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-4 h-4" />
                    <Input
                      name="search"
                      placeholder="Search products..."
                      defaultValue={sp.search || ''}
                      className="pl-10 text-black placeholder:text-black"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Category
                  </label>
                  <Select
                    name="category"
                    defaultValue={sp.category || ''}
                    className="w-full text-black"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Price Range */}
                <div className="text-black">
                  <label className="block text-sm font-medium mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <Input
                      name="minPrice"
                      type="number"
                      placeholder="Min Price"
                      defaultValue={sp.minPrice || ''}
                      className="text-black placeholder:text-black"
                    />
                    <Input
                      name="maxPrice"
                      type="number"
                      placeholder="Max Price"
                      defaultValue={sp.maxPrice || ''}
                      className="text-black placeholder:text-black"
                    />
                  </div>
                </div>


                <Button type="submit" className="w-full bg-black text-white hover:bg-primary hover:text-foreground">
                  Apply Filters
                </Button>
              </form>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
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
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-black">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={{
                      pathname: '/products',
                      query: {
                        category: sp.category || undefined,
                        minPrice: sp.minPrice || undefined,
                        maxPrice: sp.maxPrice || undefined,
                        size: sp.size || undefined,
                        color: sp.color || undefined,
                        search: sp.search || undefined,
                        page: String(page - 1),
                        pageSize: String(pageSize),
                      },
                    }}
                  >
                    <Button variant="outline">Previous</Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                )}

                {page < totalPages ? (
                  <Link
                    href={{
                      pathname: '/products',
                      query: {
                        category: sp.category || undefined,
                        minPrice: sp.minPrice || undefined,
                        maxPrice: sp.maxPrice || undefined,
                        size: sp.size || undefined,
                        color: sp.color || undefined,
                        search: sp.search || undefined,
                        page: String(page + 1),
                        pageSize: String(pageSize),
                      },
                    }}
                  >
                    <Button variant="outline">Next</Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
