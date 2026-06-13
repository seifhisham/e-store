import { getCategories } from '@/lib/categories'
import { Navigation } from '@/components/Navigation'

export async function NavigationShell() {
  const categories = await getCategories()
  return <Navigation categories={categories} />
}
