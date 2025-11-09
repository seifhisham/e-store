'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/categories'

function Dropdown({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; alignRight: boolean }>({ top: 0, left: 0, alignRight: false })

  useEffect(() => {
    setMounted(true)
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const currentLabel = options.find((o) => o.value === value)?.label || placeholder

  useEffect(() => {
    const compute = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        const estimatedWidth = 220
        const alignRight = rect.left + estimatedWidth > window.innerWidth - 8
        setPos({ top: rect.bottom + 6, left: rect.left, alignRight })
      }
    }
    if (open) {
      compute()
      window.addEventListener('resize', compute)
      window.addEventListener('scroll', compute, true)
      return () => {
        window.removeEventListener('resize', compute)
        window.removeEventListener('scroll', compute, true)
      }
    }
  }, [open])

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseDown={(e) => e.stopPropagation()}
        className="appearance-none bg-transparent text-[13px] sm:text-sm text-neutral-900 pr-2 sm:pr-4 py-0.5 focus:outline-none focus:ring-0 cursor-pointer"
      >
        {currentLabel}
        <span className="ml-1 text-neutral-500">▼</span>
      </button>
      {open && mounted &&
        createPortal(
          <div
            ref={menuRef}
            className="z-[1000] fixed min-w-[200px] max-h-[50vh] overflow-auto rounded-md border border-neutral-200 bg-white shadow-md py-1"
            style={{ top: pos.top, left: pos.alignRight ? 'auto' as any : pos.left, right: pos.alignRight ? 8 : 'auto' as any }}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`block w-full text-left px-3 py-2 text-sm ${
                  value === o.value
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  )
}

export type ProductsToolbarInitial = {
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

export function ProductsToolbar({ initial, count }: { initial: ProductsToolbarInitial; count: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const updateParam = useCallback(
    (patch: Partial<ProductsToolbarInitial>) => {
      const qp = new URLSearchParams(params?.toString() || '')
      // Apply patch
      Object.entries(patch).forEach(([k, v]) => {
        if (v == null || v === '') qp.delete(k)
        else qp.set(k, String(v))
      })
      // Reset page when filters change
      qp.set('page', '1')
      router.push(`${pathname}?${qp.toString()}`)
    },
    [params, pathname, router]
  )

  const onAvailability = (v: string) => updateParam({ availability: v })
  const onCategory = (v: string) => updateParam({ category: v })
  const onPriceRange = (v: string) => updateParam({ priceRange: v })
  const onSort = (v: string) => updateParam({ sort: v })

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:flex-nowrap overflow-x-auto">
      {/* Left group: Filter: Availability | Price */}
      <div className="flex items-center flex-nowrap gap-x-3 sm:gap-x-6 whitespace-nowrap overflow-x-auto">
        <span className="hidden sm:inline text-sm text-neutral-500">Filter:</span>

        <Dropdown
          value={initial.availability || ''}
          placeholder="Availability"
          options={[
            { label: 'Availability', value: '' },
            { label: 'In stock', value: 'in_stock' },
          ]}
          onChange={onAvailability}
        />

        <Dropdown
          value={initial.category || ''}
          placeholder="Category"
          options={[{ label: 'Category', value: '' }, ...CATEGORIES.map((c) => ({ label: c.label, value: c.value }))]}
          onChange={onCategory}
        />

        <Dropdown
          value={initial.priceRange || ''}
          placeholder="Price"
          options={[
            { label: 'Price', value: '' },
            { label: '0 - 500', value: '0-500' },
            { label: '500 - 1,000', value: '500-1000' },
            { label: '1,000 - 2,000', value: '1000-2000' },
            { label: '2,000+', value: '2000+' },
          ]}
          onChange={onPriceRange}
        />
      </div>

      {/* Right group: Sort by + count */}
      <div className="flex items-center gap-6 whitespace-nowrap">
        <span className="text-sm text-neutral-500">Sort by:</span>
        <Dropdown
          value={initial.sort || 'name_asc'}
          placeholder="Alphabetically, A-Z"
          options={[
            { label: 'Alphabetically, A-Z', value: 'name_asc' },
            { label: 'Alphabetically, Z-A', value: 'name_desc' },
            { label: 'Price, low to high', value: 'price_asc' },
            { label: 'Price, high to low', value: 'price_desc' },
          ]}
          onChange={onSort}
        />
        <span className="text-sm text-neutral-500">{count} products</span>
      </div>
    </div>
  )
}
