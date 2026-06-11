"use client";

import { HeroBackgroundSlideshow } from "@/components/HeroBackgroundSlideshow";

export function HeroSection() {
  const desktopImages = ["/images/hero-1.jpg", "/images/hero-2.jpg", "/images/hero-3.jpg"];

  return (
    <section className="relative h-[80svh] md:h-[90svh]">
      {/* Mobile video */}
      <div className="absolute inset-0 overflow-hidden bg-black md:hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/hero-1.jpg"
          className="absolute inset-0 h-full w-full object-contain"
        >
          <source src="/videos/hero-1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Desktop slideshow */}
      <div className="absolute inset-0 hidden md:block">
        <HeroBackgroundSlideshow images={desktopImages} intervalMs={5000} />
        <div className="absolute inset-0 bg-black/40" />
      </div>
    </section>
  );
}

