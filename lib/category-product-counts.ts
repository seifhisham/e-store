import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

/** Fetch exact product counts keyed by the raw `products.category` string. */
export async function getProductCountsByCategory(
  admin: SupabaseClient
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  let offset = 0

  while (true) {
    const { data, error } = await admin
      .from('products')
      .select('category')
      .not('category', 'is', null)
      .neq('category', '')
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw error
    if (!data?.length) break

    for (const row of data) {
      const cat = String(row.category).trim()
      if (!cat) continue
      counts.set(cat, (counts.get(cat) || 0) + 1)
    }

    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return counts
}

/** Resolve how many products belong to a category row (value or label, case-insensitive). */
export function countProductsForCategory(
  counts: Map<string, number>,
  value: string,
  label: string
): number {
  const trimmedValue = value.trim()
  const trimmedLabel = label.trim()

  if (counts.has(trimmedValue)) return counts.get(trimmedValue)!
  if (trimmedLabel !== trimmedValue && counts.has(trimmedLabel)) {
    return counts.get(trimmedLabel)!
  }

  const valueLower = trimmedValue.toLowerCase()
  const labelLower = trimmedLabel.toLowerCase()
  let total = 0

  for (const [key, n] of counts) {
    const keyLower = key.trim().toLowerCase()
    if (keyLower === valueLower || (trimmedLabel !== trimmedValue && keyLower === labelLower)) {
      total += n
    }
  }

  return total
}

export async function attachProductCounts<
  T extends { value: string; label: string }
>(admin: SupabaseClient, categories: T[]) {
  const counts = await getProductCountsByCategory(admin)
  return categories.map((c) => ({
    ...c,
    product_count: countProductsForCategory(counts, c.value, c.label),
  }))
}
