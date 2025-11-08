import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/HeroSection";
import { CATEGORIES } from "@/lib/categories";

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch featured products
  const { data: products } = await supabase
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
    .limit(8);

  

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-lg text-gray-600">Find your perfect style from our curated collections.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={{ pathname: '/products', query: { category: c.value } }}
                aria-label={`Shop ${c.label}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-lg border bg-white transition-shadow duration-300 group-hover:shadow-md">
                  <div className="relative aspect-[4/3] w-full">
                    <img
                      src={c.image}
                      alt={c.label}
                      className="absolute inset-0 block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex rounded-md bg-black/60 px-3 py-1 text-sm font-medium text-white">
                        {c.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              Discover our most popular items
            </p>
          </div>
          
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products available yet.</p>
              <Link href="/admin/products">
                <Button>Add Products</Button>
              </Link>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/products">
              <Button variant="outline" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      
    </div>
  );
}
