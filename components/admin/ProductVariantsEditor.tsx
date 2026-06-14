'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Plus, X, ChevronUp, ChevronDown, GripVertical, ArrowUpDown } from 'lucide-react'
import { sortVariantsBySize } from '@/lib/size-order'

export type VariantFormRow = {
  id?: string
  clientKey?: string
  size: string
  color: string
  stock_quantity: string
  price_adjustment: string
}

type ProductVariantsEditorProps = {
  variants: VariantFormRow[]
  onChange: (variants: VariantFormRow[]) => void
  sizes: string[]
  colors: string[]
}

function createEmptyVariant(): VariantFormRow {
  return {
    clientKey: crypto.randomUUID(),
    size: '',
    color: '',
    stock_quantity: '',
    price_adjustment: '',
  }
}

function moveVariant(variants: VariantFormRow[], from: number, to: number) {
  if (to < 0 || to >= variants.length || from === to) return variants
  const next = [...variants]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function ProductVariantsEditor({
  variants,
  onChange,
  sizes,
  colors,
}: ProductVariantsEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const updateVariant = (index: number, field: keyof VariantFormRow, value: string) => {
    onChange(
      variants.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant))
    )
  }

  const addVariant = () => {
    onChange([...variants, createEmptyVariant()])
  }

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index))
  }

  const moveUp = (index: number) => {
    onChange(moveVariant(variants, index, index - 1))
  }

  const moveDown = (index: number) => {
    onChange(moveVariant(variants, index, index + 1))
  }

  const sortBySize = () => {
    onChange(sortVariantsBySize(variants))
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      return
    }
    onChange(moveVariant(variants, draggedIndex, targetIndex))
    setDraggedIndex(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={sortBySize}
            className="bg-black text-white hover:bg-primary hover:text-foreground"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Sort by size
          </Button>
          <Button
            type="button"
            onClick={addVariant}
            size="sm"
            className="bg-black text-white hover:bg-primary hover:text-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Drag rows or use the arrows to arrange variants. Use &quot;Sort by size&quot; to order smallest to largest.
      </p>

      <datalist id="sizes-list">
        {sizes.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div
            key={variant.id ?? variant.clientKey ?? index}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => setDraggedIndex(null)}
            className={`grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 p-4 border border-gray-200 rounded-lg ${
              draggedIndex === index ? 'opacity-50' : ''
            }`}
          >
            <div className="flex md:flex-col items-center justify-center gap-1">
              <button
                type="button"
                aria-label="Drag to reorder"
                className="cursor-grab active:cursor-grabbing p-1 text-gray-600 hover:text-gray-900"
              >
                <GripVertical className="w-5 h-5" />
              </button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="h-9 w-9 p-0 border-gray-400 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-100 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200"
                aria-label="Move up"
              >
                <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveDown(index)}
                disabled={index === variants.length - 1}
                className="h-9 w-9 p-0 border-gray-400 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-100 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200"
                aria-label="Move down"
              >
                <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <Input
                value={variant.size}
                onChange={(e) => updateVariant(index, 'size', e.target.value)}
                placeholder="e.g. M or 32"
                list="sizes-list"
                className="placeholder:text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <Select
                value={variant.color}
                onChange={(e) => updateVariant(index, 'color', e.target.value)}
              >
                <option value="">Select color</option>
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <Input
                type="number"
                className="placeholder:text-black"
                value={variant.stock_quantity}
                onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment ($)</label>
              <Input
                type="number"
                step="0.01"
                className="placeholder:text-black"
                value={variant.price_adjustment}
                onChange={(e) => updateVariant(index, 'price_adjustment', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeVariant(index)}
                className="text-white hover:white"
                aria-label="Remove variant"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { createEmptyVariant }
