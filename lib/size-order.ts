export const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

const LETTER_SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

function getSizeSortKey(size: string): [group: number, order: number | string] {
  const trimmed = size.trim()
  if (!trimmed) return [3, '']

  const upper = trimmed.toUpperCase()
  const letterIndex = LETTER_SIZE_ORDER.indexOf(upper)
  if (letterIndex >= 0) return [0, letterIndex]

  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return [1, numeric]
  }

  return [2, upper]
}

export function compareSizes(a: string, b: string): number {
  const [groupA, orderA] = getSizeSortKey(a)
  const [groupB, orderB] = getSizeSortKey(b)

  if (groupA !== groupB) return groupA - groupB
  if (typeof orderA === 'number' && typeof orderB === 'number') return orderA - orderB
  return String(orderA).localeCompare(String(orderB))
}

export function sortVariantsBySize<T extends { size: string }>(variants: T[]): T[] {
  return [...variants].sort((a, b) => compareSizes(a.size, b.size))
}
