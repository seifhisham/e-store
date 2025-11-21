import { createAdminClient } from '@/lib/supabase/server'

export async function getActiveDiscountPercent(productId: string): Promise<number> {
  try {
    const supabase = await createAdminClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('discount_products')
      .select(`
        discount:discounts (
          percentage,
          active,
          starts_at,
          ends_at
        )
      `)
      .eq('product_id', productId)

    if (error || !data) return 0

    const percents = (data as any[])
      .map((row) => row.discount)
      .filter(Boolean)
      .filter((d: any) => d.active === true)
      .filter((d: any) => (!d.starts_at || d.starts_at <= now) && (!d.ends_at || d.ends_at >= now))
      .map((d: any) => Number(d.percentage) || 0)

    if (percents.length === 0) return 0
    return Math.max(...percents)
  } catch {
    // If table doesn't exist yet or any error occurs, treat as no discount
    return 0
  }
}
