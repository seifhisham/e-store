import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/Button'
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
}

interface ProductsPageProps {
  searchParams: SearchParams
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
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
    `)

  // Apply filters
  if (searchParams.category) {
    query = query.eq('category', searchParams.category)
  }
  
  if (searchParams.minPrice) {
    query = query.gte('base_price', searchParams.minPrice)
  }
  
  if (searchParams.maxPrice) {
    query = query.lte('base_price', searchParams.maxPrice)
  }

  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`)
  }

  const { data: products } = await query

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">All Products</h1>
          <p className="text-gray-600">Discover our complete collection</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>
              
              <form className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      name="search"
                      placeholder="Search products..."
                      defaultValue={searchParams.search || ''}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select
                    name="category"
                    defaultValue={searchParams.category || ''}
                    className="w-full"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <Input
                      name="minPrice"
                      type="number"
                      placeholder="Min Price"
                      defaultValue={searchParams.minPrice || ''}
                    />
                    <Input
                      name="maxPrice"
                      type="number"
                      placeholder="Max Price"
                      defaultValue={searchParams.maxPrice || ''}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
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
                <div className="text-gray-500 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/products'}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
