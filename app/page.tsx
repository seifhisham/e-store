import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { NewCollectionBanner } from "@/components/NewCollectionBanner";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/HeroSection";
import { CATEGORIES } from "@/lib/categories";

export default async function Home() {
  const supabase = await createClient();
  // Fetch up to 4 latest products per category
  const sections = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const { data } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          category,
          created_at,
          images:product_images(image_url, is_primary),
          variants:product_variants(id, size, color, price_adjustment, stock_quantity)
        `)
        .eq('category', cat.value)
        .order('created_at', { ascending: false })
        .limit(4);

      return { category: cat, products: data || [] };
    })
  );

  const now = Date.now();
  const isNew = (created_at?: string | null) => {
    if (!created_at) return false;
    const created = new Date(created_at).getTime();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    return now - created < fourteenDays;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />
      <NewCollectionBanner />

      {/* Category Sections */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {sections.map(({ category, products }) => (
            products.length === 0 ? null : (
            <section
              key={category.value}
              className="mt-10"
              aria-labelledby={`heading-${category.value}`}
            >
              <h2 id={`heading-${category.value}`} className="text-2xl font-bold text-gray-900">
                {category.label}
              </h2>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p: any) => (
                  <ProductCard key={p.id} product={p} isNew={isNew(p.created_at)} showActions={false} />
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <Link
                  href={{ pathname: '/products', query: { category: category.value } }}
                  aria-label={`View all products in ${category.label}`}
                  className="inline-block group text-center"
                >
                  <span className="block text-xs uppercase tracking-[0.15em] text-black font-medium">
                    View All {category.label}
                  </span>
                  <span
                    className="block h-px bg-black mt-1 transition-colors duration-200 group-hover:bg-neutral-800"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </section>
          ))) }
        </div>
      </div>
    </div>
  );
}
