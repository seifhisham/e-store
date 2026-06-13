import { createClient } from '@/lib/supabase/server'

export type CategoryItem = {
  id: string
  value: string
  label: string
}

const FALLBACK_CATEGORIES: CategoryItem[] = [
  { id: 'fallback-denim', value: 'Denim', label: 'Denim' },
  { id: 'fallback-knitwear', value: 'KnitWear', label: 'KnitWear' },
  { id: 'fallback-cardigan', value: 'Cardigan', label: 'Cardigan' },
  { id: 'fallback-sweaters', value: 'Sweaters', label: 'Sweaters' },
  { id: 'fallback-jackets', value: 'Jackets', label: 'Jackets' },
  { id: 'fallback-coats', value: 'Coats', label: 'Coats' },
  { id: 'fallback-sweatpants', value: 'SweatPants', label: 'SweatPants' },
  { id: 'fallback-men', value: 'Men', label: 'Men' },
  { id: 'fallback-unisex', value: 'Unisex', label: 'Unisex' },
]

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, value, label')
      .order('label', { ascending: true })

    if (error || !data?.length) return FALLBACK_CATEGORIES
    return data
  } catch {
    return FALLBACK_CATEGORIES
  }
}
