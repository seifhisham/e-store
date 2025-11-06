import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Leaf, Truck, Star } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Fashion for every moment</h1>
            <p className="text-lg text-gray-600">
              We craft everyday essentials and standout pieces with quality fabrics, thoughtful design, and fair prices.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/products">
                <Button className="bg-black text-white hover:bg-primary hover:text-foreground">Shop Collection</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">What we value</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-lg border bg-white p-6">
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mb-4">
              <Star className="w-5 h-5 text-gray-900" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Quality First</h3>
            <p className="text-sm text-gray-600">Premium materials and careful craftsmanship across every piece.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-gray-900" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Secure Checkout</h3>
            <p className="text-sm text-gray-600">Safe payments powered by trusted providers and best practices.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mb-4">
              <Leaf className="w-5 h-5 text-gray-900" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Considered Impact</h3>
            <p className="text-sm text-gray-600">We aim to reduce waste and source responsibly wherever possible.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5 text-gray-900" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Fast Delivery</h3>
            <p className="text-sm text-gray-600">Reliable shipping options with real-time tracking and updates.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-semibold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">1.5K+</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900">4.8/5</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-lg border bg-white p-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-xl font-semibold text-gray-900">Refresh your wardrobe</h3>
            <p className="text-gray-600">Explore new arrivals and best sellers, updated weekly.</p>
          </div>
          <Link href="/products">
            <Button className="bg-black text-white hover:bg-primary hover:text-foreground">Shop Now</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
