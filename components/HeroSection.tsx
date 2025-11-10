"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HeroBackgroundSlideshow } from "@/components/HeroBackgroundSlideshow";

export function HeroSection() {

  const desktopImages = ["/images/hero-1.jpg", "/images/hero-2.jpg", "/images/hero-3.jpg"];
  const mobileImages = ["/images/mobile-1.jpg", "/images/mobile-2.JPG", "/images/mobile-3.jpg","/images/mobile-4.jpg"];

  return (
    <section className="relative text-white h-[80svh] md:h-[90svh]">
      {/* Small screens slideshow */}
      <div className="absolute inset-0 md:hidden">
        <HeroBackgroundSlideshow images={mobileImages} intervalMs={5000} />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Desktop and up slideshow */}
      <div className="absolute inset-0 hidden md:block">
        <HeroBackgroundSlideshow images={desktopImages} intervalMs={5000} />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Centered Content */}
      <div className="relative h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Discover Your Style</h1>
            <p className="text-xl md:text-2xl mb-8 text-white/80">Shop the latest fashion trends and express your unique personality</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg" className="text-black">Shop Now</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="text-white hover:bg-foreground hover:text-primary">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

