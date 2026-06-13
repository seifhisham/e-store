import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/categories'

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
