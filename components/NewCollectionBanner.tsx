'use client'

import React from 'react'

export function NewCollectionBanner() {
  const tokens = Array.from({ length: 16 }, () => 'NEW COLLECTION')
  return (
    <div role="region" aria-label="New collection banner" className="w-full overflow-hidden bg-neutral-600">
      <div className="flex whitespace-nowrap items-center [animation:marquee_18s_linear_infinite]">
        <div className="flex gap-10 pr-10">
          {tokens.map((t, i) => (
            <span
              key={`a-${i}`}
              className="py-2 text-xs md:text-sm lg:text-base font-semibold uppercase tracking-[0.2em] text-black/90"
            >
              {t}
            </span>
          ))}
        </div>
        <div aria-hidden className="flex gap-10 pr-10">
          {tokens.map((t, i) => (
            <span
              key={`b-${i}`}
              className="py-2 text-xs md:text-sm lg:text-base font-semibold uppercase tracking-[0.2em] text-black/90"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
