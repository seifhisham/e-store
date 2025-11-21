import { NextRequest, NextResponse } from 'next/server'
import { getActiveDiscountPercent } from '@/lib/discounts'

export async function POST(request: NextRequest) {
  try {
    const { productIds } = await request.json()
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ percents: {} })
    }
    const out: Record<string, number> = {}
    await Promise.all(
      productIds.map(async (id: string) => {
        const p = await getActiveDiscountPercent(id)
        out[id] = p
      })
    )
    return NextResponse.json({ percents: out })
  } catch {
    return NextResponse.json({ percents: {} })
  }
}
