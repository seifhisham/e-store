"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

type HeroBackgroundSlideshowProps = {
  images: string[];
  intervalMs?: number;
  className?: string;
  quality?: number;
  objectPosition?: string;
  onControls?: (controls: { prev: () => void; next: () => void } | null) => void;
};

export function HeroBackgroundSlideshow({
  images,
  intervalMs = 5000,
  className,
  quality = 95,
  objectPosition = "center",
  onControls,
}: HeroBackgroundSlideshowProps) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInstant, setIsInstant] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // autoplay using a simple timer
  useEffect(() => {
    if (safeImages.length <= 1) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [safeImages.length, intervalMs]);

  // expose simple prev/next controls to parent
  useEffect(() => {
    if (!onControls) return;
    const controls = {
      prev: () => {
        setIsInstant(true);
        setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
        setTimeout(() => setIsInstant(false), 50);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setActiveIndex((p) => (p + 1) % safeImages.length);
          }, intervalMs);
        }
      },
      next: () => {
        setIsInstant(true);
        setActiveIndex((prev) => (prev + 1) % safeImages.length);
        setTimeout(() => setIsInstant(false), 50);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setActiveIndex((p) => (p + 1) % safeImages.length);
          }, intervalMs);
        }
      },
    };
    onControls(controls);
    return () => onControls(null);
  }, [onControls, safeImages.length, intervalMs]);

  if (safeImages.length === 0) return null;

  return (
    <div className={["absolute inset-0 overflow-hidden", className].filter(Boolean).join(" ")}> 
      <div className="h-full w-full">
        <div className="relative h-full w-full">
          {safeImages.map((src, idx) => (
            <div key={src + idx} className="absolute inset-0">
              <Image
                src={src}
                alt="Hero background"
                fill
                priority={idx === 0}
                sizes="100vw"
                quality={quality}
                className={[
                  "object-cover object-center",
                  isInstant ? "transition-opacity duration-0" : "transition-opacity duration-1000 ease-in-out",
                  idx === activeIndex ? "opacity-100" : "opacity-0",
                  "absolute inset-0",
                  "bg-cover bg-center bg-no-repeat",
                ].join(" ")}
                style={{ objectPosition, imageRendering: "auto" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


